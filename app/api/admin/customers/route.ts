import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, logAdminAction, createAdminClient } from '@/lib/security/admin'
import { withAdminRateLimit } from '@/lib/security/ratelimit'

// GET /api/admin/customers - List all customers (admin only)
export const GET = withAdminRateLimit(async (req, { userId }) => {
  try {
    const supabase = createAdminClient()
    
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    await logAdminAction(userId, 'LIST_CUSTOMERS', 'customers', {
      count: customers?.length || 0
    })

    return NextResponse.json({ customers })
  } catch (error: any) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
})

// POST /api/admin/customers - Create new customer (admin only)
export const POST = withAdminRateLimit(async (req, { userId }) => {
  try {
    const body = await req.json()
    const { email, companyName, phoneNumber, plan, isAdmin } = body

    // Validate input
    if (!email || !companyName || !phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Check if customer already exists
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('phone_numbers', [phoneNumber])
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Customer with this phone number already exists' },
        { status: 409 }
      )
    }

    // Generate secure password
    const { generateSecurePassword } = await import('@/lib/security/password')
    const password = generateSecurePassword(16)

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        company_name: companyName,
        phone_number: phoneNumber,
        plan
      }
    })

    if (authError) throw authError

    if (authData.user) {
      // Create customer record
      const { error: customerError } = await supabase
        .from('customers')
        .insert({
          id: authData.user.id,
          company_name: companyName,
          phone_numbers: [phoneNumber],
          plan: plan || 'basic',
          settings: {
            active: true,
            is_admin: isAdmin || false,
            onboarding_completed: false
          }
        })

      if (customerError) throw customerError

      await logAdminAction(userId, 'CREATE_CUSTOMER', 'customers', {
        customer_id: authData.user.id,
        email,
        company_name: companyName
      })

      return NextResponse.json({ 
        success: true,
        customer_id: authData.user.id,
        temporary_password: password // Send this securely to the customer
      })
    }

    throw new Error('Failed to create user')
  } catch (error: any) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create customer' },
      { status: 500 }
    )
  }
})

// PATCH /api/admin/customers/[id] - Update customer (admin only)
export const PATCH = withAdminRateLimit(async (req, { userId }) => {
  try {
    const body = await req.json()
    const { customerId, updates } = body

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', customerId)

    if (error) throw error

    await logAdminAction(userId, 'UPDATE_CUSTOMER', 'customers', {
      customer_id: customerId,
      updates
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
})

// DELETE /api/admin/customers/[id] - Delete customer (admin only)
export const DELETE = withAdminRateLimit(async (req, { userId }) => {
  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('id')

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Delete auth user (will cascade delete customer record)
    const { error } = await supabase.auth.admin.deleteUser(customerId)

    if (error) throw error

    await logAdminAction(userId, 'DELETE_CUSTOMER', 'customers', {
      customer_id: customerId
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
})