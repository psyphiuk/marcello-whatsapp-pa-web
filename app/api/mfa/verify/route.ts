import { NextRequest, NextResponse } from 'next/server'
import { verifyMFALogin } from '@/lib/security/mfa'
import { updateSessionMFA } from '@/lib/security/session'
import { withRateLimit } from '@/lib/security/ratelimit'
import { logSecurityEvent, logFailedLogin } from '@/lib/security/audit'

// POST /api/mfa/verify - Verify MFA token during login
export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const { userId, token, isBackupCode, sessionToken } = await req.json()

    if (!userId || !token) {
      return NextResponse.json(
        { error: 'Dati mancanti' },
        { status: 400 }
      )
    }

    // Verify MFA token
    const result = await verifyMFALogin(userId, token, isBackupCode)

    if (result.success) {
      // Update session to mark MFA as verified
      if (sessionToken) {
        await updateSessionMFA(sessionToken, true)
      }

      // Log successful MFA
      await logSecurityEvent({
        userId,
        action: 'MFA_VERIFY_SUCCESS',
        resource: 'authentication',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
        metadata: { isBackupCode }
      })

      return NextResponse.json({
        success: true,
        message: 'MFA verificato con successo'
      })
    } else {
      // Log failed MFA attempt
      await logSecurityEvent({
        userId,
        action: 'MFA_VERIFY_FAILED',
        resource: 'authentication',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
        errorMessage: result.error,
        metadata: { isBackupCode }
      })

      return NextResponse.json(
        { error: result.error || 'Verifica fallita' },
        { status: 401 }
      )
    }
  } catch (error: any) {
    console.error('MFA verification error:', error)
    return NextResponse.json(
      { error: 'Errore durante la verifica MFA' },
      { status: 500 }
    )
  }
}, 'auth')