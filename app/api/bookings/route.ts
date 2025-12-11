import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

// Initialize Airtable with timeout configuration
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
  requestTimeout: 30000, // 30 seconds timeout
}).base(process.env.AIRTABLE_BASE_ID || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, date, bookingType, bookingTypeName, timeSlot, startTime, endTime, roomId, roomName, totalPrice, receiptUrl, receiptFileName } = body;

    // Validate required fields
    if (!firstName || !lastName || !timeSlot || !roomId || !date) {
      return NextResponse.json(
        { 
          error: 'กรุณากรอกข้อมูลให้ครบถ้วน',
          details: 'กรุณากรอกชื่อ นามสกุล เลือกวันที่ และเลือกช่วงเวลาและห้อง'
        },
        { status: 400 }
      );
    }

    // Create record in Airtable
    // Note: Airtable doesn't support data URLs for attachments
    // For now, we'll save the record without the receipt attachment
    // In production, upload the file to a storage service (S3, Cloudinary, etc.) first
    // and then use that URL for the attachment
    
    const fields: Record<string, any> = {
      'First Name': firstName,
      'Last Name': lastName,
      'Time Slot': timeSlot,
      'Room ID': roomId,
      'Room Name': roomName,
      'Created At': new Date().toISOString(), // วันที่ทำรายการ (วันที่สร้าง record)
    };

    // Add booking date (วันที่จองที่ผู้ใช้เลือก) - Airtable Date field expects YYYY-MM-DD format
    if (date) {
      // Ensure date is in YYYY-MM-DD format
      const dateValue = date.includes('T') ? date.split('T')[0] : date;
      fields['Date'] = dateValue; // วันที่จอง (วันที่ที่ผู้ใช้เลือกจาก calendar)
    }

    // Add start and end times if provided
    // Note: These fields are optional - only add if they exist in Airtable
    // If you get UNKNOWN_FIELD_NAME error, remove these fields from Airtable or add them to your table
    // For now, we'll skip these fields to avoid errors
    // if (startTime) {
    //   fields['Start Time'] = startTime;
    // }
    // if (endTime) {
    //   fields['End Time'] = endTime;
    // }

    // Add booking type if provided
    if (bookingTypeName) {
      fields['Booking Type'] = bookingTypeName;
    }

    // Add total price if provided
    if (totalPrice !== undefined && totalPrice !== null) {
      fields['Total Price'] = Number(totalPrice);
    }

    // Add Status - make sure "Pending" option exists in Airtable Status field
    // If you get INVALID_MULTIPLE_CHOICE_OPTIONS error, add "Pending" option in Airtable
    // Go to Airtable → Bookings table → Status field → Add option "Pending"
    fields['Status'] = 'Pending';

    // Add receipt attachment if URL is provided (from Imgur or other storage service)
    if (receiptUrl && receiptFileName) {
      try {
        // Ensure URL is absolute (starts with http:// or https://)
        const absoluteUrl = receiptUrl.startsWith('http://') || receiptUrl.startsWith('https://') 
          ? receiptUrl 
          : `https://${receiptUrl}`;
        
        fields['Receipt'] = [
          {
            url: absoluteUrl,
            filename: receiptFileName,
          },
        ];
        console.log('Adding receipt attachment to Airtable:', absoluteUrl);
      } catch (receiptError) {
        console.error('Error adding receipt attachment:', receiptError);
        // Continue without receipt if attachment fails
      }
    } else {
      console.log('No receipt URL provided - skipping receipt attachment');
    }

    // Retry logic for network issues
    let records;
    let retries = 3;
    let lastError;
    
    while (retries > 0) {
      try {
        records = await base(process.env.AIRTABLE_TABLE_NAME || 'Bookings').create([
          { fields },
        ]);
        break; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        retries--;
        
        // If it's a timeout error and we have retries left, wait and retry
        if ((error?.code === 'ETIMEDOUT' || error?.errno === 'ETIMEDOUT') && retries > 0) {
          console.log(`Retry attempt ${3 - retries + 1}/3 after timeout...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          continue;
        }
        
        // If it's not a timeout or no retries left, throw the error
        throw error;
      }
    }
    
    if (!records) {
      throw lastError;
    }

    // Send notification to LINE Official Account after successful booking
    try {
      // Get LINE credentials
      // LINE_USER_ID คือ User ID ของ admin/เจ้าของระบบที่จะรับการแจ้งเตือน
      // ไม่ใช่ User ID ของลูกค้า (ลูกค้าไม่ต้องมี LINE OA)
      const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      const lineUserId = process.env.LINE_USER_ID || body.lineUserId;

      if (!lineChannelAccessToken || !lineUserId) {
        console.log('LINE credentials not set - skipping LINE notification');
        console.log('LINE_CHANNEL_ACCESS_TOKEN:', lineChannelAccessToken ? 'set' : 'not set');
        console.log('LINE_USER_ID:', lineUserId ? 'set' : 'not set');
      } else {
        // Calculate hours if startTime and endTime are provided
        let hours: number | undefined;
        if (startTime && endTime) {
          const [startHour, startMin] = startTime.split(':').map(Number);
          const [endHour, endMin] = endTime.split(':').map(Number);
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          hours = (endMinutes - startMinutes) / 60;
        }

        // Fetch room price from Airtable directly
        let roomPricePerHour: number | undefined;
        try {
          const roomRecords = await base('Rooms')
            .select({
              filterByFormula: `{Room ID} = "${roomId}"`,
              maxRecords: 1,
            })
            .all();
          
          if (roomRecords && roomRecords.length > 0) {
            roomPricePerHour = roomRecords[0].get('Price Per Hour') as number;
          }
        } catch (roomError) {
          console.error('Error fetching room price for LINE notification:', roomError);
          // Continue without room price
        }

        // Get booking type additional price from request body if available
        const bookingTypeAdditionalPrice = body.bookingTypeAdditionalPrice;

        // Format date
        const dateFormatted = date ? new Date(date).toLocaleDateString('th-TH', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }) : '';

        // Format message
        let message = `🎵 การจองห้องซ้อมดนตรีใหม่\n\n`;
        message += `👤 ชื่อ-นามสกุล: ${firstName} ${lastName}\n`;
        message += `📅 วันที่จอง: ${dateFormatted}\n`;
        message += `⏰ ช่วงเวลา: ${timeSlot}\n`;
        message += `🏠 ห้อง: ${roomName}\n`;
        
        if (bookingTypeName) {
          message += `📋 ประเภทการจอง: ${bookingTypeName}\n`;
        }
        
        if (hours) {
          message += `⏱️ จำนวนชั่วโมง: ${hours.toFixed(2)} ชั่วโมง\n`;
        }
        
        if (roomPricePerHour && hours) {
          message += `💰 ราคาห้อง: ${(roomPricePerHour * hours).toLocaleString('th-TH')} บาท\n`;
        }
        
        if (bookingTypeAdditionalPrice && hours) {
          message += `➕ ราคาเพิ่มเติม: ${(bookingTypeAdditionalPrice * hours).toLocaleString('th-TH')} บาท\n`;
        }
        
        message += `\n💵 ยอดรวม: ${(totalPrice || 0).toLocaleString('th-TH')} บาท\n`;
        
        if (receiptUrl) {
          message += `\n📎 ใบเสร็จ: ${receiptUrl}`;
        }
        
        message += `\n\n⏰ เวลาที่ทำรายการ: ${new Date().toLocaleString('th-TH')}`;

        // Get record ID for updating status later
        const recordId = records[0].id;

        // Prepare LINE message payload with buttons
        // First send text message
        const messages: any[] = [
          {
            type: 'text',
            text: message,
          },
        ];

        // Add receipt image if exists
        if (receiptUrl) {
          messages.push({
            type: 'image',
            originalContentUrl: receiptUrl,
            previewImageUrl: receiptUrl,
          });
        }

        // Add template message with approve/cancel buttons
        // Using postback action to send data back to webhook
        messages.push({
          type: 'template',
          altText: 'กรุณาเลือกอนุมัติหรือยกเลิกการจอง',
          template: {
            type: 'buttons',
            text: 'กรุณาเลือกอนุมัติหรือยกเลิกการจอง',
            actions: [
              {
                type: 'postback',
                label: '✅ อนุมัติ',
                data: `action=approve&recordId=${recordId}`,
                displayText: 'อนุมัติการจอง',
              },
              {
                type: 'postback',
                label: '❌ ยกเลิก',
                data: `action=cancel&recordId=${recordId}`,
                displayText: 'ยกเลิกการจอง',
              },
            ],
          },
        });

        const linePayload: any = {
          to: lineUserId,
          messages: messages,
        };

        // Send to LINE Messaging API (don't wait for response to avoid blocking)
        fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lineChannelAccessToken}`,
          },
          body: JSON.stringify(linePayload),
        })
          .then(async (response) => {
            const data = await response.json();
            if (!response.ok) {
              console.error('LINE Messaging API error:', data);
            } else {
              console.log('LINE notification sent successfully');
            }
          })
          .catch((lineError) => {
            console.error('Failed to send LINE notification:', lineError);
          });
      }
    } catch (lineError) {
      // Log error but don't fail the booking
      console.error('Error preparing LINE notification:', lineError);
    }

    return NextResponse.json(
      { success: true, recordId: records[0].id },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error saving to Airtable:', error);
    
    // Handle specific Airtable errors
    if (error?.error === 'NOT_AUTHORIZED' || error?.statusCode === 403) {
      return NextResponse.json(
        { 
          error: 'ไม่ได้รับอนุญาตให้เข้าถึง Airtable',
          details: 'กรุณาตรวจสอบว่า Personal Access Token มีสิทธิ์เข้าถึง Base นี้ และมี Scopes: data.records:read, data.records:write'
        },
        { status: 403 }
      );
    }
    
    if (error?.error === 'INVALID_ATTACHMENT_OBJECT') {
      return NextResponse.json(
        { 
          error: 'ไม่สามารถอัปโหลดไฟล์ได้',
          details: 'Airtable ไม่รองรับ data URL สำหรับ attachment กรุณาอัปโหลดไฟล์ไปยัง storage service ก่อน'
        },
        { status: 422 }
      );
    }
    
    if (error?.error === 'INVALID_MULTIPLE_CHOICE_OPTIONS' || error?.message?.includes('select option')) {
      return NextResponse.json(
        { 
          error: 'Field Status ไม่มี option "Pending"',
          details: 'กรุณาไปที่ Airtable → Table "Bookings" → Field "Status" → เพิ่ม option "Pending" (ดู STATUS_FIELD_FIX.md)'
        },
        { status: 422 }
      );
    }
    
    if (error?.error === 'INVALID_VALUE_FOR_COLUMN' && (error?.message?.includes('Receipt') || error?.message?.includes('attachment'))) {
      return NextResponse.json(
        { 
          error: 'ไม่สามารถบันทึกรูปใบเสร็จได้',
          details: 'Airtable ไม่สามารถรับ URL จาก Imgur ได้ กรุณาตรวจสอบว่า Field "Receipt" เป็น Type "Attachment" และ URL ถูกต้อง (ดู RECEIPT_TROUBLESHOOTING.md)'
        },
        { status: 422 }
      );
    }
    
    if (error?.error === 'INVALID_VALUE_FOR_COLUMN' && (error?.message?.includes('Date') || error?.message?.toLowerCase().includes('date'))) {
      return NextResponse.json(
        { 
          error: 'ไม่สามารถบันทึกวันที่ได้',
          details: 'กรุณาตรวจสอบว่า Field "Date" มีอยู่ใน Airtable และเป็น Type "Date" หรือ "Single line text" (ถ้าเป็น Date field ต้องเป็น format YYYY-MM-DD)'
        },
        { status: 422 }
      );
    }
    
    if (error?.error === 'UNKNOWN_FIELD_NAME') {
      const fieldName = error?.message?.match(/Unknown field name: "([^"]+)"/)?.[1] || 'unknown';
      return NextResponse.json(
        { 
          error: `Field "${fieldName}" ไม่มีใน Airtable`,
          details: `กรุณาตรวจสอบว่า Field "${fieldName}" มีอยู่ใน Airtable Table "Bookings" หรือลบ field นี้จากการส่งข้อมูล`
        },
        { status: 422 }
      );
    }
    
    // Handle network timeout errors
    if (error?.code === 'ETIMEDOUT' || error?.errno === 'ETIMEDOUT') {
      return NextResponse.json(
        { 
          error: 'การเชื่อมต่อ timeout',
          details: 'ไม่สามารถเชื่อมต่อกับ Airtable ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองอีกครั้ง',
          troubleshooting: 'ดูไฟล์ NETWORK_FIX.md สำหรับวิธีแก้ไขปัญหา network timeout'
        },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'ไม่สามารถบันทึกข้อมูลได้',
        details: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
      },
      { status: 500 }
    );
  }
}

