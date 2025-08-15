import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

// Default pricing configuration (can be overridden from admin)
export const DEFAULT_PRICING = {
  setupFee: 500, // EUR
  basicMonthly: 100, // EUR
  proMonthly: 200, // EUR
  currency: 'eur'
}

// Price IDs from Stripe Dashboard (these would be created in Stripe)
export const STRIPE_PRICE_IDS = {
  setupFee: process.env.NEXT_PUBLIC_STRIPE_SETUP_PRICE_ID || '',
  basicMonthly: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || '',
  proMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || ''
}