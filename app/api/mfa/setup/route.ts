import { NextRequest, NextResponse } from 'next/server'
import { generateMFASecret, generateMFAQRCode, enableMFA } from '@/lib/security/mfa'
import { withSession } from '@/lib/security/session'
import { withRateLimit } from '@/lib/security/ratelimit'

// GET /api/mfa/setup - Generate MFA secret and QR code
export const GET = withRateLimit(
  withSession(async (req, { userId }) => {
    try {
      // Get user email for MFA setup
      const { createAdminClient } = await import('@/lib/security/admin')
      const supabase = createAdminClient()
      
      const { data: user, error } = await supabase
        .from('customers')
        .select('email')
        .eq('id', userId)
        .single()

      if (error || !user) {
        return NextResponse.json(
          { error: 'Utente non trovato' },
          { status: 404 }
        )
      }

      // Generate MFA secret
      const { secret, otpauth_url } = generateMFASecret(user.email)
      
      // Generate QR code
      const qrCode = await generateMFAQRCode(otpauth_url)

      return NextResponse.json({
        secret,
        qrCode,
        manualEntry: secret
      })
    } catch (error: any) {
      console.error('MFA setup error:', error)
      return NextResponse.json(
        { error: 'Errore durante la configurazione MFA' },
        { status: 500 }
      )
    }
  }),
  'api'
)

// POST /api/mfa/setup - Enable MFA with verification
export const POST = withRateLimit(
  withSession(async (req, { userId }) => {
    try {
      const { secret, verificationCode } = await req.json()

      if (!secret || !verificationCode) {
        return NextResponse.json(
          { error: 'Dati mancanti' },
          { status: 400 }
        )
      }

      const result = await enableMFA(userId, secret, verificationCode)

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Verifica fallita' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        backupCodes: result.backupCodes
      })
    } catch (error: any) {
      console.error('MFA enable error:', error)
      return NextResponse.json(
        { error: 'Errore durante l\'attivazione MFA' },
        { status: 500 }
      )
    }
  }),
  'api'
)