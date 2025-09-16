import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  console.log('[Send Test] Starting test message endpoint')

  try {
    // Get the authenticated user
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('[Send Test] No authenticated user')
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    console.log('[Send Test] User authenticated:', user.email)

    // Get customer data and authorized phone numbers
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('phone_numbers, settings')
      .eq('id', user.id)
      .single()

    if (customerError || !customer) {
      console.error('[Send Test] Customer not found:', customerError)
      return NextResponse.json(
        { error: 'Cliente non trovato' },
        { status: 404 }
      )
    }

    console.log('[Send Test] Customer found with phone numbers:', customer.phone_numbers)

    // Get the request body
    const { phoneNumber, message } = await request.json()
    console.log('[Send Test] Request to send to:', phoneNumber)

    // Validate the phone number is authorized
    if (!customer.phone_numbers.includes(phoneNumber)) {
      console.error('[Send Test] Phone number not authorized:', phoneNumber)
      return NextResponse.json(
        { error: 'Numero non autorizzato' },
        { status: 403 }
      )
    }

    // Get WhatsApp configuration from environment
    const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const whatsappBusinessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID

    console.log('[Send Test] WhatsApp Config:', {
      hasPhoneNumberId: !!whatsappPhoneNumberId,
      phoneNumberId: whatsappPhoneNumberId,
      hasAccessToken: !!whatsappAccessToken,
      tokenPreview: whatsappAccessToken?.substring(0, 20) + '...',
      businessAccountId: whatsappBusinessAccountId
    })

    if (!whatsappPhoneNumberId || !whatsappAccessToken) {
      console.error('[Send Test] WhatsApp configuration missing')
      return NextResponse.json(
        { error: 'WhatsApp non configurato - mancano WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_ACCESS_TOKEN' },
        { status: 500 }
      )
    }

    // Format phone number - ensure it has country code and no special characters
    let formattedPhone = phoneNumber.replace(/[^\d+]/g, '')
    if (!formattedPhone.startsWith('+')) {
      // Assume Italian number if no country code
      formattedPhone = formattedPhone.startsWith('39') ? formattedPhone : '39' + formattedPhone
    } else {
      formattedPhone = formattedPhone.substring(1) // Remove the + for the API
    }

    console.log('[Send Test] Formatted phone number:', formattedPhone)

    // Send the message via WhatsApp Business API
    const url = `https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`
    console.log('[Send Test] Calling WhatsApp API:', url)

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'text',
      text: {
        body: message || `🤖 Ciao! Sono il tuo assistente WhatsApp PICORTEX AI.

Questo è un messaggio di test per confermare che il servizio è attivo e funzionante.

Puoi inviarmi messaggi per:
• 📅 Gestire il tuo calendario
• 📧 Inviare email
• 📝 Prendere note e promemoria
• 📁 Accedere ai tuoi documenti
• ⚡ E molto altro!

Scrivi "aiuto" per vedere tutti i comandi disponibili.`
      }
    }

    console.log('[Send Test] Request payload:', JSON.stringify(payload, null, 2))

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const responseText = await response.text()
    console.log('[Send Test] WhatsApp API Response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText
    })

    if (!response.ok) {
      console.error('[Send Test] WhatsApp API error:', responseText)

      // Parse error for more details
      try {
        const errorData = JSON.parse(responseText)
        console.error('[Send Test] Parsed error:', errorData)

        // Check for specific error types
        if (errorData.error?.message?.includes('phone number')) {
          return NextResponse.json(
            { error: 'Numero di telefono non valido o non registrato su WhatsApp', details: errorData },
            { status: 400 }
          )
        }
        if (errorData.error?.message?.includes('token')) {
          return NextResponse.json(
            { error: 'Token WhatsApp non valido o scaduto', details: errorData },
            { status: 401 }
          )
        }

        return NextResponse.json(
          { error: `Errore WhatsApp API: ${errorData.error?.message || 'Sconosciuto'}`, details: errorData },
          { status: response.status }
        )
      } catch (e) {
        return NextResponse.json(
          { error: 'Errore invio messaggio', details: responseText },
          { status: response.status }
        )
      }
    }

    let result
    try {
      result = JSON.parse(responseText)
      console.log('[Send Test] Success! Message ID:', result.messages?.[0]?.id)
    } catch (e) {
      console.error('[Send Test] Could not parse success response:', responseText)
      result = { messages: [{ id: 'unknown' }] }
    }

    // Log the test message
    await supabase
      .from('notifications')
      .insert({
        customer_id: user.id,
        type: 'test_message',
        title: 'Messaggio di test inviato',
        message: `Messaggio di test inviato a ${phoneNumber}`,
        metadata: {
          message_id: result.messages?.[0]?.id,
          phone_number: formattedPhone,
          timestamp: new Date().toISOString()
        }
      })

    return NextResponse.json({
      success: true,
      message_id: result.messages?.[0]?.id,
      message: 'Messaggio di test inviato con successo',
      phone_sent_to: formattedPhone
    })

  } catch (error: any) {
    console.error('[Send Test] Unexpected error:', error)
    console.error('[Send Test] Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Errore interno del server', details: error.message },
      { status: 500 }
    )
  }
}