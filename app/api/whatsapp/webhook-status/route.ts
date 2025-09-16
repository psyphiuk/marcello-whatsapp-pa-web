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

    // Extract the actual phone number from the API response
    const actualPhoneNumber = phoneDetails.display_phone_number || phoneDetails.verified_name || 'Not found'

    return NextResponse.json({
      phoneNumberDetails: phoneDetails,
      actualBusinessNumber: actualPhoneNumber,
      webhookStatus: webhookData,
      templates: templatesData,
      environment: {
        phoneNumberId,
        businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
        hasWebhookToken: !!process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
        displayPhoneNumber: process.env.WHATSAPP_DISPLAY_PHONE_NUMBER,
        configuredDisplayNumber: process.env.WHATSAPP_DISPLAY_PHONE_NUMBER
      },
      testMode: phoneDetails.quality_rating === 'GREEN' ? false : true,
      importantInfo: {
        yourNumber: '447925533340 (needs to be added to Meta allowed list)',
        botNumber: actualPhoneNumber + ' (customers send messages TO this number)',
        whatToDo: 'Add 447925533340 to the allowed test numbers in Meta dashboard'
      },
      notes: [
        'The BOT number is: ' + actualPhoneNumber,
        'YOUR number (447925533340) needs to be added to Meta test users',
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