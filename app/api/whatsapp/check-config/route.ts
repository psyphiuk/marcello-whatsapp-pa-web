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

    // Get WhatsApp configuration
    const config: any = {
      WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || 'NOT SET',
      WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || 'NOT SET',
      WHATSAPP_DISPLAY_PHONE_NUMBER: process.env.WHATSAPP_DISPLAY_PHONE_NUMBER || 'NOT SET',
      WHATSAPP_VERIFIED_NAME: process.env.WHATSAPP_VERIFIED_NAME || 'NOT SET',
      HAS_ACCESS_TOKEN: !!process.env.WHATSAPP_ACCESS_TOKEN,
      TOKEN_LENGTH: process.env.WHATSAPP_ACCESS_TOKEN?.length || 0,
      TOKEN_PREVIEW: process.env.WHATSAPP_ACCESS_TOKEN
        ? process.env.WHATSAPP_ACCESS_TOKEN.substring(0, 20) + '...' + process.env.WHATSAPP_ACCESS_TOKEN.slice(-10)
        : 'NOT SET',
      WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'NOT SET'
    }

    // Try to verify the token by calling the WhatsApp API
    let tokenValid = false
    let apiError = null

    if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      try {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
            }
          }
        )

        const data = await response.json()

        if (response.ok) {
          tokenValid = true
          config.PHONE_NUMBER_INFO = data
        } else {
          apiError = data.error || data
        }
      } catch (error: any) {
        apiError = error.message
      }
    }

    return NextResponse.json({
      config,
      tokenValid,
      apiError,
      message: tokenValid
        ? 'Configuration looks good!'
        : 'Configuration issues detected - check apiError for details'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Errore interno', details: error.message },
      { status: 500 }
    )
  }
}