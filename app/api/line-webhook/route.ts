import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import Airtable from 'airtable';

// Force dynamic rendering for webhook
export const dynamic = 'force-dynamic';

// Simple in-memory storage for User IDs
// In production, you should use a database
let storedUserIds: Set<string> = new Set();

// Initialize Airtable for updating booking status
const airtableBase = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
  requestTimeout: 30000,
}).base(process.env.AIRTABLE_BASE_ID || '');

interface LineWebhookEvent {
  type: string;
  source: {
    type: string;
    userId?: string;
    groupId?: string;
  };
  message?: {
    type: string;
    text?: string;
  };
  timestamp: number;
}

interface LineWebhookBody {
  events: LineWebhookEvent[];
}

// Verify webhook signature from LINE
function verifySignature(body: string, signature: string, channelSecret: string): boolean {
  const hash = crypto
    .createHmac('sha256', channelSecret)
    .update(body)
    .digest('base64');
  return hash === signature;
}

export async function POST(request: NextRequest) {
  try {
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    
    if (!channelSecret) {
      console.error('LINE_CHANNEL_SECRET is not set');
      return NextResponse.json(
        { error: 'LINE_CHANNEL_SECRET is not configured' },
        { status: 500 }
      );
    }

    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-line-signature');

    // Verify signature
    if (signature && !verifySignature(rawBody, signature, channelSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const body: LineWebhookBody = JSON.parse(rawBody);

    // Handle webhook events
    for (const event of body.events) {
      console.log('Received LINE webhook event:', event.type);

      // Handle message events to extract User ID
      if (event.type === 'message' && event.source.userId) {
        const userId = event.source.userId;
        const userType = event.source.type; // 'user' or 'group'
        
        console.log(`📝 User ID detected: ${userId} (Type: ${userType})`);
        
        // Store User ID
        storedUserIds.add(userId);
        console.log(`\n✅ LINE User ID: ${userId} (เก็บไว้ในระบบแล้ว)`);
        console.log(`\n📋 User IDs ที่เก็บไว้: ${Array.from(storedUserIds).join(', ')}`);
        console.log(`\n💡 คุณสามารถดู User IDs ได้ที่: /api/line-users`);
        console.log(`\nหรือคัดลอก User ID นี้ไปใส่ในไฟล์ .env:`);
        console.log(`LINE_USER_ID=${userId}\n`);

        // Optional: Reply to confirm
        if (event.message?.type === 'text') {
          const replyToken = (event as any).replyToken;
          const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

          if (replyToken && channelAccessToken) {
            try {
              await fetch('https://api.line.me/v2/bot/message/reply', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${channelAccessToken}`,
                },
                body: JSON.stringify({
                  replyToken,
                  messages: [
                    {
                      type: 'text',
                      text: `✅ ระบบได้รับ User ID ของคุณแล้ว!\n\nUser ID: ${userId}\n\nกรุณาคัดลอก User ID นี้ไปใส่ในไฟล์ .env ของระบบ:\nLINE_USER_ID=${userId}`,
                    },
                  ],
                }),
              });
            } catch (replyError) {
              console.error('Error replying to LINE message:', replyError);
            }
          }
        }
      }

      // Handle follow event (when user adds LINE OA as friend)
      if (event.type === 'follow' && event.source.userId) {
        const userId = event.source.userId;
        
        // Store User ID
        storedUserIds.add(userId);
        console.log(`\n✅ New user followed: ${userId} (เก็บไว้ในระบบแล้ว)`);
        console.log(`\n📋 User IDs ที่เก็บไว้: ${Array.from(storedUserIds).join(', ')}`);
        console.log(`\n💡 คุณสามารถดู User IDs ได้ที่: /api/line-users`);
        console.log(`\nหรือคัดลอก User ID นี้ไปใส่ในไฟล์ .env:`);
        console.log(`LINE_USER_ID=${userId}\n`);

        const replyToken = (event as any).replyToken;
        const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

        if (replyToken && channelAccessToken) {
          try {
            await fetch('https://api.line.me/v2/bot/message/reply', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${channelAccessToken}`,
              },
              body: JSON.stringify({
                replyToken,
                messages: [
                  {
                    type: 'text',
                    text: `สวัสดีครับ! ขอบคุณที่เพิ่ม LINE OA นี้เป็นเพื่อน\n\nระบบจะส่งการแจ้งเตือนการจองห้องซ้อมดนตรีมาที่นี่\n\nUser ID: ${userId}`,
                  },
                ],
              }),
            });
          } catch (replyError) {
            console.error('Error replying to follow event:', replyError);
          }
        }
      }

      // Handle postback event (when user clicks button)
      if (event.type === 'postback') {
        const postbackData = (event as any).postback?.data;
        const replyToken = (event as any).replyToken;
        const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

        if (postbackData && replyToken && channelAccessToken) {
          try {
            // Parse postback data: action=approve&recordId=xxx
            const params = new URLSearchParams(postbackData);
            const action = params.get('action');
            const recordId = params.get('recordId');

            console.log(`📥 Received postback: action=${action}, recordId=${recordId}`);

            if (action && recordId) {
              let newStatus: string;
              let statusMessage: string;

              if (action === 'approve') {
                newStatus = 'Confirmed';
                statusMessage = '✅ อนุมัติการจองเรียบร้อยแล้ว';
              } else if (action === 'cancel') {
                newStatus = 'Cancelled';
                statusMessage = '❌ ยกเลิกการจองเรียบร้อยแล้ว';
              } else {
                console.error('Unknown action:', action);
                return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
              }

              // Update status in Airtable
              try {
                await airtableBase(process.env.AIRTABLE_TABLE_NAME || 'Bookings').update([
                  {
                    id: recordId,
                    fields: {
                      'Status': newStatus,
                    },
                  },
                ]);

                console.log(`✅ Updated booking ${recordId} status to ${newStatus}`);

                // Reply to LINE user
                await fetch('https://api.line.me/v2/bot/message/reply', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${channelAccessToken}`,
                  },
                  body: JSON.stringify({
                    replyToken,
                    messages: [
                      {
                        type: 'text',
                        text: statusMessage,
                      },
                    ],
                  }),
                });
              } catch (airtableError: any) {
                console.error('Error updating Airtable:', airtableError);
                
                // Reply error to LINE user
                await fetch('https://api.line.me/v2/bot/message/reply', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${channelAccessToken}`,
                  },
                  body: JSON.stringify({
                    replyToken,
                    messages: [
                      {
                        type: 'text',
                        text: '❌ เกิดข้อผิดพลาดในการอัพเดทสถานะ กรุณาลองอีกครั้ง',
                      },
                    ],
                  }),
                });
              }
            }
          } catch (postbackError) {
            console.error('Error processing postback:', postbackError);
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error processing LINE webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

// LINE requires GET endpoint for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'LINE Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}

