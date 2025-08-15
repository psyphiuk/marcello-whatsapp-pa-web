/**
 * Input validation and sanitization utilities
 */

import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

// Validation error class
export class ValidationError extends Error {
  constructor(
    public field: string,
    public message: string,
    public value?: any
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Validation result type
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  sanitized?: any
}

/**
 * Sanitize HTML input to prevent XSS
 */
export function sanitizeHtml(input: string, allowedTags: string[] = []): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: []
  })
}

/**
 * Sanitize plain text input (remove all HTML)
 */
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  })
}

/**
 * Validate and sanitize email
 */
export function validateEmail(email: string): ValidationResult {
  const errors: ValidationError[] = []
  
  if (!email || typeof email !== 'string') {
    errors.push(new ValidationError('email', 'Email è obbligatoria'))
    return { isValid: false, errors }
  }

  const trimmed = email.trim().toLowerCase()
  
  if (!validator.isEmail(trimmed)) {
    errors.push(new ValidationError('email', 'Email non valida'))
    return { isValid: false, errors }
  }

  return {
    isValid: true,
    errors: [],
    sanitized: trimmed
  }
}

/**
 * Validate and sanitize phone number (Italian format)
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  const errors: ValidationError[] = []
  
  if (!phone || typeof phone !== 'string') {
    errors.push(new ValidationError('phone', 'Numero di telefono obbligatorio'))
    return { isValid: false, errors }
  }

  // Remove spaces and special characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Check for Italian mobile phone format
  if (!validator.isMobilePhone(cleaned, 'it-IT')) {
    errors.push(new ValidationError('phone', 'Numero di telefono non valido (formato italiano)'))
    return { isValid: false, errors }
  }

  return {
    isValid: true,
    errors: [],
    sanitized: cleaned
  }
}

/**
 * Validate company name
 */
export function validateCompanyName(name: string): ValidationResult {
  const errors: ValidationError[] = []
  
  if (!name || typeof name !== 'string') {
    errors.push(new ValidationError('companyName', 'Nome azienda obbligatorio'))
    return { isValid: false, errors }
  }

  const sanitized = sanitizeText(name.trim())
  
  if (sanitized.length < 2) {
    errors.push(new ValidationError('companyName', 'Nome azienda troppo corto (minimo 2 caratteri)'))
    return { isValid: false, errors }
  }

  if (sanitized.length > 100) {
    errors.push(new ValidationError('companyName', 'Nome azienda troppo lungo (massimo 100 caratteri)'))
    return { isValid: false, errors }
  }

  return {
    isValid: true,
    errors: [],
    sanitized
  }
}

/**
 * Validate URL
 */
export function validateUrl(url: string, options?: { requireHttps?: boolean }): ValidationResult {
  const errors: ValidationError[] = []
  
  if (!url || typeof url !== 'string') {
    errors.push(new ValidationError('url', 'URL obbligatorio'))
    return { isValid: false, errors }
  }

  const trimmed = url.trim()
  
  if (!validator.isURL(trimmed, {
    protocols: options?.requireHttps ? ['https'] : ['http', 'https'],
    require_protocol: true
  })) {
    errors.push(new ValidationError('url', 'URL non valido'))
    return { isValid: false, errors }
  }

  return {
    isValid: true,
    errors: [],
    sanitized: trimmed
  }
}

/**
 * Validate alphanumeric string (for IDs, codes, etc.)
 */
export function validateAlphanumeric(
  value: string,
  field: string = 'value',
  options?: {
    minLength?: number
    maxLength?: number
    allowDashes?: boolean
    allowUnderscores?: boolean
  }
): ValidationResult {
  const errors: ValidationError[] = []
  
  if (!value || typeof value !== 'string') {
    errors.push(new ValidationError(field, `${field} è obbligatorio`))
    return { isValid: false, errors }
  }

  const trimmed = value.trim()
  
  // Check alphanumeric with optional dashes/underscores
  let pattern = '^[a-zA-Z0-9'
  if (options?.allowDashes) pattern += '-'
  if (options?.allowUnderscores) pattern += '_'
  pattern += ']+$'
  
  if (!new RegExp(pattern).test(trimmed)) {
    errors.push(new ValidationError(field, `${field} contiene caratteri non validi`))
    return { isValid: false, errors }
  }

  if (options?.minLength && trimmed.length < options.minLength) {
    errors.push(new ValidationError(field, `${field} troppo corto (minimo ${options.minLength} caratteri)`))
    return { isValid: false, errors }
  }

  if (options?.maxLength && trimmed.length > options.maxLength) {
    errors.push(new ValidationError(field, `${field} troppo lungo (massimo ${options.maxLength} caratteri)`))
    return { isValid: false, errors }
  }

  return {
    isValid: true,
    errors: [],
    sanitized: trimmed
  }
}

/**
 * Validate numeric value
 */
export function validateNumber(
  value: any,
  field: string = 'value',
  options?: {
    min?: number
    max?: number
    integer?: boolean
  }
): ValidationResult {
  const errors: ValidationError[] = []
  
  const num = Number(value)
  
  if (isNaN(num)) {
    errors.push(new ValidationError(field, `${field} deve essere un numero`))
    return { isValid: false, errors }
  }

  if (options?.integer && !Number.isInteger(num)) {
    errors.push(new ValidationError(field, `${field} deve essere un numero intero`))
    return { isValid: false, errors }
  }

  if (options?.min !== undefined && num < options.min) {
    errors.push(new ValidationError(field, `${field} deve essere almeno ${options.min}`))
    return { isValid: false, errors }
  }

  if (options?.max !== undefined && num > options.max) {
    errors.push(new ValidationError(field, `${field} non può superare ${options.max}`))
    return { isValid: false, errors }
  }

  return {
    isValid: true,
    errors: [],
    sanitized: num
  }
}

/**
 * Validate discount code
 */
export function validateDiscountCode(code: string): ValidationResult {
  return validateAlphanumeric(code, 'codice sconto', {
    minLength: 3,
    maxLength: 50,
    allowDashes: true,
    allowUnderscores: true
  })
}

/**
 * Validate plan type
 */
export function validatePlan(plan: string): ValidationResult {
  const errors: ValidationError[] = []
  const validPlans = ['basic', 'pro']
  
  if (!plan || !validPlans.includes(plan)) {
    errors.push(new ValidationError('plan', 'Piano non valido. Deve essere "basic" o "pro"'))
    return { isValid: false, errors }
  }

  return {
    isValid: true,
    errors: [],
    sanitized: plan
  }
}

/**
 * Validate request body for common customer operations
 */
export interface CustomerInput {
  email?: string
  companyName?: string
  phoneNumber?: string
  plan?: string
}

export function validateCustomerInput(input: CustomerInput): ValidationResult {
  const errors: ValidationError[] = []
  const sanitized: any = {}

  if (input.email) {
    const emailResult = validateEmail(input.email)
    if (!emailResult.isValid) {
      errors.push(...emailResult.errors)
    } else {
      sanitized.email = emailResult.sanitized
    }
  }

  if (input.companyName) {
    const nameResult = validateCompanyName(input.companyName)
    if (!nameResult.isValid) {
      errors.push(...nameResult.errors)
    } else {
      sanitized.companyName = nameResult.sanitized
    }
  }

  if (input.phoneNumber) {
    const phoneResult = validatePhoneNumber(input.phoneNumber)
    if (!phoneResult.isValid) {
      errors.push(...phoneResult.errors)
    } else {
      sanitized.phoneNumber = phoneResult.sanitized
    }
  }

  if (input.plan) {
    const planResult = validatePlan(input.plan)
    if (!planResult.isValid) {
      errors.push(...planResult.errors)
    } else {
      sanitized.plan = planResult.sanitized
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  }
}

/**
 * Escape SQL special characters (for raw queries - prefer parameterized queries)
 */
export function escapeSql(value: string): string {
  if (typeof value !== 'string') return ''
  return value.replace(/['"\\\0\n\r\x1a]/g, (char) => {
    switch (char) {
      case "'": return "''"
      case '"': return '""'
      case '\\': return '\\\\'
      case '\0': return '\\0'
      case '\n': return '\\n'
      case '\r': return '\\r'
      case '\x1a': return '\\Z'
      default: return char
    }
  })
}

/**
 * Validate and sanitize JSON input
 */
export function validateJson(input: string): ValidationResult {
  const errors: ValidationError[] = []
  
  try {
    const parsed = JSON.parse(input)
    return {
      isValid: true,
      errors: [],
      sanitized: parsed
    }
  } catch (e) {
    errors.push(new ValidationError('json', 'JSON non valido'))
    return { isValid: false, errors }
  }
}

/**
 * Rate limit check for repeated attempts
 */
const attemptTracker = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 60000
): boolean {
  const now = Date.now()
  const record = attemptTracker.get(identifier)

  if (!record || now > record.resetTime) {
    attemptTracker.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return true
  }

  if (record.count >= maxAttempts) {
    return false
  }

  record.count++
  return true
}