import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    // Get customer data and authorized phone numbers
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('phone_numbers, settings')
      .eq('id', user.id)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Cliente non trovato' },
        { status: 404 }
      )
    }

    // Get the request body
    const { phoneNumber, message } = await request.json()

    // Validate the phone number is authorized
    if (!customer.phone_numbers.includes(phoneNumber)) {
      return NextResponse.json(
        { error: 'Numero non autorizzato' },
        { status: 403 }
      )
    }

    // Get WhatsApp configuration from environment
    const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN

    if (!whatsappPhoneNumberId || !whatsappAccessToken) {
      console.error('WhatsApp configuration missing')
      return NextResponse.json(
        { error: 'WhatsApp non configurato' },
        { status: 500 }
      )
    }

    // Send the message via WhatsApp Business API
    const url = `https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber.replace(/[^\d+]/g, ''), // Clean phone number
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
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('WhatsApp API error:', error)
      return NextResponse.json(
        { error: 'Errore invio messaggio', details: error },
        { status: response.status }
      )
    }

    const result = await response.json()

    // Log the test message
    await supabase
      .from('notifications')
      .insert({
        customer_id: user.id,
        type: 'test_message',
        title: 'Messaggio di test inviato',
        message: `Messaggio di test inviato a ${phoneNumber}`,
        metadata: { message_id: result.messages?.[0]?.id }
      })

    return NextResponse.json({
      success: true,
      message_id: result.messages?.[0]?.id,
      message: 'Messaggio di test inviato con successo'
    })

  } catch (error: any) {
    console.error('Error sending test message:', error)
    return NextResponse.json(
      { error: 'Errore interno del server', details: error.message },
      { status: 500 }
    )
  }
}