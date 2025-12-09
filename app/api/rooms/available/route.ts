import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

// Initialize Airtable with timeout configuration
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
  requestTimeout: 30000, // 30 seconds timeout
}).base(process.env.AIRTABLE_BASE_ID || '');

/**
 * Check if two time ranges overlap
 * @param start1 Start time of range 1 (HH:MM format)
 * @param end1 End time of range 1 (HH:MM format)
 * @param start2 Start time of range 2 (HH:MM format)
 * @param end2 End time of range 2 (HH:MM format)
 * @returns true if ranges overlap
 */
function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  // Convert HH:MM to minutes since midnight for easier comparison
  const toMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start1Min = toMinutes(start1);
  const end1Min = toMinutes(end1);
  const start2Min = toMinutes(start2);
  const end2Min = toMinutes(end2);

  // Check for overlap: ranges overlap if start1 < end2 AND start2 < end1
  return start1Min < end2Min && start2Min < end1Min;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, startTime, endTime } = body;

    // Validate required fields
    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        {
          error: 'กรุณาระบุวันที่และช่วงเวลา',
          details: 'กรุณาระบุวันที่ เวลาเริ่มต้น และเวลาสิ้นสุด'
        },
        { status: 400 }
      );
    }

    // Validate time range
    if (startTime >= endTime) {
      return NextResponse.json(
        {
          error: 'ช่วงเวลาไม่ถูกต้อง',
          details: 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น'
        },
        { status: 400 }
      );
    }

    // Get all rooms (you can modify this to get from Airtable or use a constant)
    const allRooms = [
      { id: 'room1', name: 'ห้องที่ 1' },
      { id: 'room2', name: 'ห้องที่ 2' },
    ];

    try {
      // Fetch existing bookings from Airtable for the selected date
      const table = base(process.env.AIRTABLE_TABLE_NAME || 'Bookings');
      
      // Query bookings with Confirmed or Pending status
      // We'll filter by date in code since Airtable date format can vary
      const records = await table.select({
        filterByFormula: `OR({Status} = "Confirmed", {Status} = "Pending")`,
      }).all();

      // Get booked rooms (rooms with Confirmed or Pending status that overlap with selected time)
      const bookedRoomIds = new Set<string>();

      for (const record of records) {
        const fields = record.fields;
        const bookingStatus = fields['Status'] as string;
        const bookingRoomId = fields['Room ID'] as string;
        const bookingStartTime = fields['Start Time'] as string;
        const bookingEndTime = fields['End Time'] as string;
        const bookingDate = fields['Date'] as string;

        // Check if booking is for the selected date
        // Handle different date formats (YYYY-MM-DD, ISO string, etc.)
        let bookingDateStr = '';
        if (typeof bookingDate === 'string') {
          // If it's already a string, use it directly (might be YYYY-MM-DD)
          bookingDateStr = bookingDate.split('T')[0]; // Remove time part if present
        } else if (bookingDate) {
          // If it's a Date object or other format, convert to string
          bookingDateStr = new Date(bookingDate).toISOString().split('T')[0];
        }

        // Only process bookings for the selected date
        if (bookingDateStr === date) {
          // Only consider Confirmed or Pending bookings
          if (bookingStatus === 'Confirmed' || bookingStatus === 'Pending') {
            // Check if booking time overlaps with selected time
            if (bookingStartTime && bookingEndTime) {
              if (timeRangesOverlap(startTime, endTime, bookingStartTime, bookingEndTime)) {
                bookedRoomIds.add(bookingRoomId);
              }
            }
          }
        }
      }

      // Filter available rooms (rooms not in bookedRoomIds)
      const availableRooms = allRooms.filter(room => !bookedRoomIds.has(room.id));

      return NextResponse.json(
        {
          success: true,
          availableRooms: availableRooms.map(room => room.id),
          rooms: availableRooms,
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error('Error fetching available rooms from Airtable:', error);

      // If there's an error, return all rooms as available (fallback)
      // This ensures the app still works even if Airtable is unavailable
      console.warn('Falling back to showing all rooms as available');
      return NextResponse.json(
        {
          success: true,
          availableRooms: allRooms.map(room => room.id),
          rooms: allRooms,
          warning: 'ไม่สามารถเชื่อมต่อกับ Airtable ได้ กำลังแสดงห้องทั้งหมด',
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error in available rooms API:', error);
    return NextResponse.json(
      {
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้อง',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

