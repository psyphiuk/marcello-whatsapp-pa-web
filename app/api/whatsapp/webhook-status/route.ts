import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json({
        error: 'WhatsApp configuration missing',
        details: 'WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN not set'
      }, { status: 500 })
    }

    // Check phone number details
    const phoneDetailsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    const phoneDetails = await phoneDetailsResponse.json()

    // Check webhook configuration
    const webhookResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/subscribed_apps`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    const webhookData = await webhookResponse.json()

    // Check message templates (if available)
    const templatesResponse = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    const templatesData = await templatesResponse.json()

    return NextResponse.json({
      phoneNumberDetails: phoneDetails,
      webhookStatus: webhookData,
      templates: templatesData,
      environment: {
        phoneNumberId,
        businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
        hasWebhookToken: !!process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
        displayPhoneNumber: process.env.WHATSAPP_DISPLAY_PHONE_NUMBER
      },
      testMode: phoneDetails.quality_rating === 'GREEN' ? false : true,
      notes: [
        'If in test/sandbox mode, recipient numbers must be added to the test users list',
        'Check if the phone number has WhatsApp installed',
        'Verify the number format matches WhatsApp requirements',
        'For new WhatsApp Business accounts, there may be sending limits'
      ]
    })

  } catch (error: any) {
    console.error('Webhook status error:', error)
    return NextResponse.json(
      { error: 'Error checking webhook status', details: error.message },
      { status: 500 }
    )
  }
}