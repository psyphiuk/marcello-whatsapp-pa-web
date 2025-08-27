import { NextRequest, NextResponse } from 'next/server';

const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ WhatsApp webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }

  console.error('❌ WhatsApp webhook verification failed');
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.entry && body.entry.length > 0) {
      for (const entry of body.entry) {
        const changes = entry.changes;
        
        if (changes && changes.length > 0) {
          for (const change of changes) {
            if (change.field === 'messages') {
              const messages = change.value.messages;
              
              if (messages && messages.length > 0) {
                for (const message of messages) {
                  await handleIncomingMessage(message);
                }
              }
            }
          }
        }
      }
    }
    
    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function handleIncomingMessage(message: any) {
  const from = message.from;
  const messageText = message.text?.body;
  const messageType = message.type;
  
  console.log(`📱 Received ${messageType} message from ${from}: ${messageText}`);
  
  if (messageType === 'text' && messageText) {
    await sendTextMessage(from, `Ciao! Hai scritto: "${messageText}". Il tuo assistente personale è qui per aiutarti!`);
  }
}

async function sendTextMessage(to: string, text: string) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: {
            preview_url: false,
            body: text,
          },
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Error sending WhatsApp message:', error);
    } else {
      console.log('✅ Message sent successfully');
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}