/**
 * Password security utilities
 */

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  preventCommonPasswords: boolean
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true
}

// List of common passwords to prevent
const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567', 'letmein', 'trustno1', 'dragon', 'baseball',
  'iloveyou', 'master', 'sunshine', 'ashley', 'bailey', 'passw0rd',
  'shadow', '123123', '654321', 'superman', 'qazwsx', 'admin'
]

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  score: number // 0-5 strength score
}

export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): PasswordValidationResult {
  const errors: string[] = []
  let score = 0

  // Check minimum length
  if (password.length < policy.minLength) {
    errors.push(`La password deve contenere almeno ${policy.minLength} caratteri`)
  } else {
    score += 1
  }

  // Check uppercase requirement
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera maiuscola')
  } else if (policy.requireUppercase) {
    score += 1
  }

  // Check lowercase requirement
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera minuscola')
  } else if (policy.requireLowercase) {
    score += 1
  }

  // Check numbers requirement
  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('La password deve contenere almeno un numero')
  } else if (policy.requireNumbers) {
    score += 1
  }

  // Check special characters requirement
  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('La password deve contenere almeno un carattere speciale')
  } else if (policy.requireSpecialChars) {
    score += 1
  }

  // Check common passwords
  if (policy.preventCommonPasswords) {
    const passwordLower = password.toLowerCase()
    if (COMMON_PASSWORDS.includes(passwordLower)) {
      errors.push('Questa password è troppo comune. Scegline una più sicura')
      score = Math.max(0, score - 2)
    }
  }

  // Additional strength checks for scoring
  if (password.length >= 16) score = Math.min(5, score + 1)
  if (/(.)\1{2,}/.test(password)) {
    // Check for repeated characters
    errors.push('La password non deve contenere caratteri ripetuti consecutivamente')
    score = Math.max(0, score - 1)
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(5, Math.max(0, score))
  }
}

export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allChars = uppercase + lowercase + numbers + special
  let password = ''
  
  // Ensure at least one of each required character type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export function getPasswordStrengthLabel(score: number): string {
  switch (score) {
    case 0: return 'Molto debole'
    case 1: return 'Debole'
    case 2: return 'Accettabile'
    case 3: return 'Buona'
    case 4: return 'Forte'
    case 5: return 'Molto forte'
    default: return 'Sconosciuta'
  }
}

export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0: return '#ff0000'
    case 1: return '#ff6600'
    case 2: return '#ffaa00'
    case 3: return '#99cc00'
    case 4: return '#33cc00'
    case 5: return '#00aa00'
    default: return '#999999'
  }
}