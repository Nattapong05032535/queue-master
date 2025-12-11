import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for User IDs
// In production, you should use a database
let storedUserIds: string[] = [];

export async function GET(request: NextRequest) {
  try {
    // Get User ID from environment variable
    const envUserId = process.env.LINE_USER_ID;

    return NextResponse.json({
      success: true,
      userIds: {
        fromEnv: envUserId || null,
        fromWebhook: storedUserIds,
      },
      message: storedUserIds.length > 0 
        ? `พบ User IDs จาก webhook: ${storedUserIds.join(', ')}`
        : 'ยังไม่มี User ID จาก webhook',
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'เกิดข้อผิดพลาด',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'กรุณาระบุ userId' 
        },
        { status: 400 }
      );
    }

    // Add userId if not already exists
    if (!storedUserIds.includes(userId)) {
      storedUserIds.push(userId);
    }

    return NextResponse.json({
      success: true,
      message: `เพิ่ม User ID สำเร็จ: ${userId}`,
      userIds: storedUserIds,
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'เกิดข้อผิดพลาด',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

