import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route สำหรับอัปโหลดไฟล์ไปยัง Imgur
 * Imgur API: https://api.imgur.com/endpoints/image
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, imageType } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Imgur API endpoint
    const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;

    if (!IMGUR_CLIENT_ID) {
      return NextResponse.json(
        { 
          error: 'Imgur Client ID ไม่ได้ตั้งค่า',
          details: 'กรุณาเพิ่ม IMGUR_CLIENT_ID ใน .env.local (ดู IMGUR_SETUP.md)'
        },
        { status: 500 }
      );
    }

    // Upload to Imgur
    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
        type: 'base64',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Imgur API error:', data);
      
      // Handle specific Imgur errors
      if (data.data?.error?.includes('over capacity') || response.status === 500) {
        return NextResponse.json(
          { 
            error: 'Imgur กำลังมีปัญหา',
            details: 'Imgur server กำลังมีปัญหา กรุณาลองอีกครั้งในภายหลัง หรือใช้ storage service อื่น',
            retry: true
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to upload image to Imgur',
          details: data.data?.error || 'Unknown error'
        },
        { status: response.status }
      );
    }

    // Return the image URL
    return NextResponse.json(
      { 
        success: true,
        imageUrl: data.data.link,
        deleteHash: data.data.deletehash, // สำหรับลบรูปในอนาคต
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error uploading to Imgur:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

