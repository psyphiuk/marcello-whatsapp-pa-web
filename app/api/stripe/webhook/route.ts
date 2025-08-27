import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  // Initialize Stripe and Supabase inside the function to avoid build-time initialization
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-07-30.basil'
  })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Update customer with subscription info
        if (session.metadata?.customer_id) {
          await supabase
            .from('customers')
            .update({
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              subscription_status: 'active',
              plan: session.metadata.plan || 'basic',
              settings: {
                payment_completed: true,
                payment_date: new Date().toISOString(),
                is_admin: session.metadata.is_admin === 'true'
              }
            })
            .eq('id', session.metadata.customer_id)

          // Create subscription record
          await supabase
            .from('subscriptions')
            .insert({
              customer_id: session.metadata.customer_id,
              stripe_subscription_id: session.subscription,
              stripe_customer_id: session.customer,
              plan: session.metadata.plan || 'basic',
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date().toISOString(),
            current_period_end: subscription.canceled_at 
              ? new Date(subscription.canceled_at * 1000).toISOString()
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        // Update customer status
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('customer_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (sub) {
          await supabase
            .from('customers')
            .update({
              subscription_status: subscription.status
            })
            .eq('id', sub.customer_id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Mark subscription as cancelled
        await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        // Update customer
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('customer_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (sub) {
          await supabase
            .from('customers')
            .update({
              subscription_status: 'cancelled',
              settings: {
                active: false
              }
            })
            .eq('id', sub.customer_id)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Log successful payment
        await supabase
          .from('billing_events')
          .insert({
            stripe_event_id: event.id,
            event_type: 'payment_succeeded',
            amount_cents: invoice.amount_paid,
            currency: invoice.currency,
            customer_stripe_id: invoice.customer,
            created_at: new Date().toISOString()
          })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Log failed payment
        await supabase
          .from('billing_events')
          .insert({
            stripe_event_id: event.id,
            event_type: 'payment_failed',
            amount_cents: invoice.amount_due,
            currency: invoice.currency,
            customer_stripe_id: invoice.customer,
            created_at: new Date().toISOString()
          })
        
        // TODO: Send notification to customer
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}