import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-08-27.basil' as any
    })

    // Initialize Supabase with service role for full access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed', status: 'unpaid' },
        { status: 400 }
      )
    }

    // Get customer details from database using metadata
    const customerId = session.metadata?.customer_id

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID not found' },
        { status: 400 }
      )
    }

    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, email, full_name, settings')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      console.error('Customer not found:', customerError)
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        full_name: customer.full_name,
        is_admin: customer.settings?.is_admin || false
      },
      payment: {
        status: session.payment_status,
        amount: session.amount_total,
        currency: session.currency
      }
    })

  } catch (error: any) {
    console.error('Error checking payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check payment status' },
      { status: 500 }
    )
  }
}