import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { withRateLimit } from '@/lib/security/ratelimit'
import { validateEmail, validateCompanyName, validateDiscountCode, validatePlan } from '@/lib/security/validation'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia'
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Verify this is server-side only
if (typeof window !== 'undefined') {
  throw new Error('Server-only code accessed from client')
}

// Special codes from environment variables (backend only)
const SPECIAL_CODES = {
  ADMIN_CODE: process.env.ADMIN_ACTIVATION_CODE || '',
  FREE_SETUP_CODE: process.env.FREE_SETUP_CODE || ''
}

export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { 
      customerId, 
      plan, 
      discountCode,
      email,
      companyName 
    } = body

    // Validate inputs
    if (email) {
      const emailValidation = validateEmail(email)
      if (!emailValidation.isValid) {
        return NextResponse.json(
          { error: emailValidation.errors[0].message },
          { status: 400 }
        )
      }
    }

    if (companyName) {
      const nameValidation = validateCompanyName(companyName)
      if (!nameValidation.isValid) {
        return NextResponse.json(
          { error: nameValidation.errors[0].message },
          { status: 400 }
        )
      }
    }

    if (plan) {
      const planValidation = validatePlan(plan)
      if (!planValidation.isValid) {
        return NextResponse.json(
          { error: planValidation.errors[0].message },
          { status: 400 }
        )
      }
    }

    if (discountCode) {
      const codeValidation = validateDiscountCode(discountCode)
      if (!codeValidation.isValid) {
        return NextResponse.json(
          { error: codeValidation.errors[0].message },
          { status: 400 }
        )
      }
    }

    // Get pricing configuration from database
    const { data: pricingConfig } = await supabase
      .from('system_config')
      .select('*')
      .eq('key', 'pricing')
      .single()

    const pricing = pricingConfig?.value || {
      setupFee: 500,
      basicMonthly: 100,
      proMonthly: 200
    }

    // Check for special codes
    let isAdmin = false
    let skipSetupFee = false
    let discountPercent = 0

    if (discountCode) {
      // Check special codes (these are never sent to frontend)
      if (discountCode === SPECIAL_CODES.ADMIN_CODE) {
        isAdmin = true
        skipSetupFee = true
        discountPercent = 100 // Free for admin
      } else if (discountCode === SPECIAL_CODES.FREE_SETUP_CODE) {
        skipSetupFee = true
      } else {
        // Check database for discount codes
        const { data: discount } = await supabase
          .from('discount_codes')
          .select('*')
          .eq('code', discountCode)
          .eq('active', true)
          .single()

        if (discount) {
          discountPercent = discount.percent_off || 0
          if (discount.skip_setup_fee) {
            skipSetupFee = true
          }

          // Update usage count
          await supabase
            .from('discount_codes')
            .update({ 
              uses_count: (discount.uses_count || 0) + 1,
              last_used_at: new Date().toISOString()
            })
            .eq('id', discount.id)
        }
      }
    }

    // Calculate prices with discounts
    const monthlyPrice = plan === 'pro' ? pricing.proMonthly : pricing.basicMonthly
    const discountedMonthly = monthlyPrice * (1 - discountPercent / 100)
    const setupFee = skipSetupFee ? 0 : pricing.setupFee

    // Create line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

    // Add setup fee if not skipped
    if (setupFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Configurazione Iniziale',
            description: 'Setup una tantum del servizio WhatsApp Assistant'
          },
          unit_amount: setupFee * 100 // Stripe uses cents
        },
        quantity: 1
      })
    }

    // Add monthly subscription
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: {
          name: `Piano ${plan === 'pro' ? 'Professional' : 'Basic'}`,
          description: plan === 'pro' 
            ? 'Messaggi illimitati, tutte le funzionalità'
            : 'Fino a 20 messaggi al giorno'
        },
        unit_amount: Math.round(discountedMonthly * 100),
        recurring: {
          interval: 'month'
        }
      },
      quantity: 1
    })

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'sepa_debit'],
      line_items: lineItems,
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/setup`,
      customer_email: email,
      metadata: {
        customer_id: customerId,
        plan: plan,
        is_admin: isAdmin.toString(),
        discount_code: discountCode || '',
        company_name: companyName
      },
      locale: 'it',
      billing_address_collection: 'required',
      tax_id_collection: {
        enabled: true
      },
      allow_promotion_codes: false, // We handle discounts ourselves
      subscription_data: {
        metadata: {
          customer_id: customerId,
          plan: plan
        }
      }
    })

    // If admin code was used, mark customer as admin
    if (isAdmin && customerId) {
      await supabase
        .from('customers')
        .update({
          settings: {
            is_admin: true,
            admin_activated_at: new Date().toISOString()
          }
        })
        .eq('id', customerId)
    }

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Errore durante la creazione del checkout' },
      { status: 500 }
    )
  }
}, 'payment')