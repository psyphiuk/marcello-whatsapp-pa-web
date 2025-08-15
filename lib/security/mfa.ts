/**
 * Multi-Factor Authentication (MFA/2FA) utilities
 */

import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// MFA configuration
const MFA_CONFIG = {
  issuer: 'WhatsApp PA',
  algorithm: 'sha256' as const,
  digits: 6,
  step: 30, // 30 seconds
  window: 2, // Allow 2 steps before/after for time sync issues
  backupCodeCount: 10,
  backupCodeLength: 8
}

// Create admin client for MFA operations
function getMFAClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

/**
 * Generate MFA secret for a user
 */
export function generateMFASecret(userEmail: string): {
  secret: string
  otpauth_url: string
} {
  const secret = speakeasy.generateSecret({
    name: `${MFA_CONFIG.issuer} (${userEmail})`,
    issuer: MFA_CONFIG.issuer,
    length: 32
  })

  return {
    secret: secret.base32,
    otpauth_url: secret.otpauth_url || ''
  }
}

/**
 * Generate QR code for MFA setup
 */
export async function generateMFAQRCode(otpauthUrl: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)
    return qrCodeDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Verify MFA token
 */
export function verifyMFAToken(token: string, secret: string): boolean {
  try {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      algorithm: MFA_CONFIG.algorithm,
      digits: MFA_CONFIG.digits,
      step: MFA_CONFIG.step,
      window: MFA_CONFIG.window
    })
  } catch (error) {
    console.error('Error verifying MFA token:', error)
    return false
  }
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(count: number = MFA_CONFIG.backupCodeCount): string[] {
  const codes: string[] = []
  
  for (let i = 0; i < count; i++) {
    const code = crypto
      .randomBytes(MFA_CONFIG.backupCodeLength)
      .toString('hex')
      .substring(0, MFA_CONFIG.backupCodeLength)
      .toUpperCase()
    
    // Format as XXXX-XXXX
    const formatted = `${code.substring(0, 4)}-${code.substring(4, 8)}`
    codes.push(formatted)
  }
  
  return codes
}

/**
 * Hash backup code for storage
 */
export function hashBackupCode(code: string): string {
  return crypto
    .createHash('sha256')
    .update(code.replace('-', ''))
    .digest('hex')
}

/**
 * Verify backup code
 */
export function verifyBackupCode(inputCode: string, hashedCodes: string[]): boolean {
  const hashedInput = hashBackupCode(inputCode)
  return hashedCodes.includes(hashedInput)
}

/**
 * Enable MFA for a user
 */
export async function enableMFA(
  userId: string,
  secret: string,
  verificationToken: string
): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
  try {
    // Verify the token first
    if (!verifyMFAToken(verificationToken, secret)) {
      return { success: false, error: 'Codice di verifica non valido' }
    }

    const supabase = getMFAClient()
    
    // Generate backup codes
    const backupCodes = generateBackupCodes()
    const hashedBackupCodes = backupCodes.map(hashBackupCode)
    
    // Update user record
    const { error } = await supabase
      .from('customers')
      .update({
        mfa_enabled: true,
        mfa_secret: secret,
        mfa_backup_codes: hashedBackupCodes,
        mfa_verified_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error enabling MFA:', error)
      return { success: false, error: 'Errore durante l\'attivazione di MFA' }
    }

    return { success: true, backupCodes }
  } catch (error) {
    console.error('Error in enableMFA:', error)
    return { success: false, error: 'Errore del sistema' }
  }
}

/**
 * Disable MFA for a user
 */
export async function disableMFA(
  userId: string,
  verificationToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getMFAClient()
    
    // Get user's MFA secret
    const { data: user, error: fetchError } = await supabase
      .from('customers')
      .select('mfa_secret')
      .eq('id', userId)
      .single()

    if (fetchError || !user?.mfa_secret) {
      return { success: false, error: 'MFA non configurato' }
    }

    // Verify the token
    if (!verifyMFAToken(verificationToken, user.mfa_secret)) {
      return { success: false, error: 'Codice di verifica non valido' }
    }

    // Disable MFA
    const { error } = await supabase
      .from('customers')
      .update({
        mfa_enabled: false,
        mfa_secret: null,
        mfa_backup_codes: null,
        mfa_verified_at: null
      })
      .eq('id', userId)

    if (error) {
      console.error('Error disabling MFA:', error)
      return { success: false, error: 'Errore durante la disattivazione di MFA' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in disableMFA:', error)
    return { success: false, error: 'Errore del sistema' }
  }
}

/**
 * Verify MFA for login
 */
export async function verifyMFALogin(
  userId: string,
  token: string,
  isBackupCode: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getMFAClient()
    
    // Get user's MFA data
    const { data: user, error: fetchError } = await supabase
      .from('customers')
      .select('mfa_secret, mfa_backup_codes')
      .eq('id', userId)
      .single()

    if (fetchError || !user) {
      return { success: false, error: 'Utente non trovato' }
    }

    let verified = false

    if (isBackupCode) {
      // Verify backup code
      if (!user.mfa_backup_codes) {
        return { success: false, error: 'Nessun codice di backup disponibile' }
      }

      const hashedInput = hashBackupCode(token)
      const codeIndex = user.mfa_backup_codes.indexOf(hashedInput)
      
      if (codeIndex !== -1) {
        // Remove used backup code
        const newBackupCodes = [...user.mfa_backup_codes]
        newBackupCodes.splice(codeIndex, 1)
        
        await supabase
          .from('customers')
          .update({ mfa_backup_codes: newBackupCodes })
          .eq('id', userId)
        
        verified = true
      }
    } else {
      // Verify TOTP token
      if (!user.mfa_secret) {
        return { success: false, error: 'MFA non configurato' }
      }
      
      verified = verifyMFAToken(token, user.mfa_secret)
    }

    if (verified) {
      // Log successful MFA verification
      await supabase
        .from('mfa_verification_attempts')
        .insert({
          customer_id: userId,
          success: true,
          attempted_at: new Date().toISOString()
        })

      // Update last MFA challenge time
      await supabase
        .from('customers')
        .update({ last_mfa_challenge: new Date().toISOString() })
        .eq('id', userId)

      return { success: true }
    } else {
      // Log failed MFA verification
      await supabase
        .from('mfa_verification_attempts')
        .insert({
          customer_id: userId,
          success: false,
          attempted_at: new Date().toISOString()
        })

      return { success: false, error: 'Codice non valido' }
    }
  } catch (error) {
    console.error('Error in verifyMFALogin:', error)
    return { success: false, error: 'Errore del sistema' }
  }
}

/**
 * Check if user has MFA enabled
 */
export async function checkMFAEnabled(userId: string): Promise<boolean> {
  try {
    const supabase = getMFAClient()
    
    const { data, error } = await supabase
      .from('customers')
      .select('mfa_enabled')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return false
    }

    return data.mfa_enabled === true
  } catch (error) {
    console.error('Error checking MFA status:', error)
    return false
  }
}

/**
 * Generate new backup codes
 */
export async function regenerateBackupCodes(
  userId: string,
  verificationToken: string
): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
  try {
    const supabase = getMFAClient()
    
    // Get user's MFA secret
    const { data: user, error: fetchError } = await supabase
      .from('customers')
      .select('mfa_secret')
      .eq('id', userId)
      .single()

    if (fetchError || !user?.mfa_secret) {
      return { success: false, error: 'MFA non configurato' }
    }

    // Verify the token
    if (!verifyMFAToken(verificationToken, user.mfa_secret)) {
      return { success: false, error: 'Codice di verifica non valido' }
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes()
    const hashedBackupCodes = backupCodes.map(hashBackupCode)
    
    // Update user record
    const { error } = await supabase
      .from('customers')
      .update({
        mfa_backup_codes: hashedBackupCodes
      })
      .eq('id', userId)

    if (error) {
      console.error('Error regenerating backup codes:', error)
      return { success: false, error: 'Errore durante la rigenerazione dei codici' }
    }

    return { success: true, backupCodes }
  } catch (error) {
    console.error('Error in regenerateBackupCodes:', error)
    return { success: false, error: 'Errore del sistema' }
  }
}

/**
 * Get MFA status for user
 */
export async function getMFAStatus(userId: string): Promise<{
  enabled: boolean
  backupCodesRemaining: number
  lastChallenge?: Date
}> {
  try {
    const supabase = getMFAClient()
    
    const { data, error } = await supabase
      .from('customers')
      .select('mfa_enabled, mfa_backup_codes, last_mfa_challenge')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return { enabled: false, backupCodesRemaining: 0 }
    }

    return {
      enabled: data.mfa_enabled || false,
      backupCodesRemaining: data.mfa_backup_codes?.length || 0,
      lastChallenge: data.last_mfa_challenge ? new Date(data.last_mfa_challenge) : undefined
    }
  } catch (error) {
    console.error('Error getting MFA status:', error)
    return { enabled: false, backupCodesRemaining: 0 }
  }
}