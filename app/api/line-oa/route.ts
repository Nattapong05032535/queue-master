import { NextRequest, NextResponse } from 'next/server';

interface BookingNotificationData {
  firstName: string;
  lastName: string;
  date: string;
  bookingTypeName?: string;
  timeSlot: string;
  roomName: string;
  totalPrice: number;
  receiptUrl?: string;
  hours?: number;
  roomPrice?: number;
  additionalPrice?: number;
}

// Format booking data into a readable message for LINE
function formatBookingMessage(data: BookingNotificationData): string {
  const date = new Date(data.date).toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let message = `🎵 การจองห้องซ้อมดนตรีใหม่\n\n`;
  message += `👤 ชื่อ-นามสกุล: ${data.firstName} ${data.lastName}\n`;
  message += `📅 วันที่จอง: ${date}\n`;
  message += `⏰ ช่วงเวลา: ${data.timeSlot}\n`;
  message += `🏠 ห้อง: ${data.roomName}\n`;
  
  if (data.bookingTypeName) {
    message += `📋 ประเภทการจอง: ${data.bookingTypeName}\n`;
  }
  
  if (data.hours) {
    message += `⏱️ จำนวนชั่วโมง: ${data.hours.toFixed(2)} ชั่วโมง\n`;
  }
  
  if (data.roomPrice && data.hours) {
    message += `💰 ราคาห้อง: ${(data.roomPrice * data.hours).toLocaleString('th-TH')} บาท\n`;
  }
  
  if (data.additionalPrice && data.hours) {
    message += `➕ ราคาเพิ่มเติม: ${(data.additionalPrice * data.hours).toLocaleString('th-TH')} บาท\n`;
  }
  
  message += `\n💵 ยอดรวม: ${data.totalPrice.toLocaleString('th-TH')} บาท\n`;
  
  if (data.receiptUrl) {
    message += `\n📎 ใบเสร็จ: ${data.receiptUrl}`;
  }
  
  message += `\n\n⏰ เวลาที่ทำรายการ: ${new Date().toLocaleString('th-TH')}`;

  return message;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingData, userId } = body;

    // Validate LINE OA credentials
    const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineChannelAccessToken) {
      console.warn('LINE_CHANNEL_ACCESS_TOKEN is not set - skipping LINE notification');
      return NextResponse.json(
        { 
          success: false, 
          error: 'LINE Channel Access Token ไม่ได้ตั้งค่า',
          message: 'กรุณาตั้งค่า LINE_CHANNEL_ACCESS_TOKEN ใน environment variables'
        },
        { status: 400 }
      );
    }

    // Validate userId (required for push message)
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User ID ไม่ได้ระบุ',
          message: 'กรุณาระบุ userId สำหรับส่งข้อความ'
        },
        { status: 400 }
      );
    }

    // Validate booking data
    if (!bookingData || !bookingData.firstName || !bookingData.lastName) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ข้อมูลการจองไม่ครบถ้วน' 
        },
        { status: 400 }
      );
    }

    // Format message
    const message = formatBookingMessage(bookingData);

    // Prepare LINE message payload
    const linePayload: any = {
      to: userId,
      messages: [
        {
          type: 'text',
          text: message,
        },
      ],
    };

    // If receipt URL exists, add image message
    if (bookingData.receiptUrl) {
      linePayload.messages.push({
        type: 'image',
        originalContentUrl: bookingData.receiptUrl,
        previewImageUrl: bookingData.receiptUrl,
      });
    }

    // Send to LINE Messaging API
    const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineChannelAccessToken}`,
      },
      body: JSON.stringify(linePayload),
    });

    const lineData = await lineResponse.json();

    if (!lineResponse.ok) {
      console.error('LINE Messaging API error:', lineData);
      return NextResponse.json(
        { 
          success: false, 
          error: 'ไม่สามารถส่งข้อความไปที่ LINE ได้',
          details: lineData.message || 'Unknown error',
          lineError: lineData
        },
        { status: lineResponse.status }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'ส่งข้อความไปที่ LINE สำเร็จ'
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error sending LINE notification:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'เกิดข้อผิดพลาดในการส่งข้อความไปที่ LINE',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

