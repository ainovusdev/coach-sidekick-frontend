/**
 * Password validation utilities for enforcing strong password requirements
 */

export interface PasswordStrength {
  hasMinLength: boolean
  hasUpperCase: boolean
  hasLowerCase: boolean
  hasNumber: boolean
  hasSpecialChar: boolean
}

export interface PasswordValidationResult {
  isValid: boolean
  strength: PasswordStrength
  score: number // 0-5
  message: string
}

/**
 * Validates password strength against security requirements
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePassword(password: string): PasswordValidationResult {
  const strength: PasswordStrength = {
    hasMinLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(password),
  }

  const score = Object.values(strength).filter(Boolean).length
  const isValid = Object.values(strength).every(Boolean)

  let message = ''
  if (isValid) {
    message = 'Password meets all requirements'
  } else if (score >= 4) {
    message = 'Almost there! Just one more requirement'
  } else if (score >= 3) {
    message = 'Good progress, keep going'
  } else if (score >= 1) {
    message = 'Password needs to be stronger'
  } else {
    message = 'Enter a password'
  }

  return { isValid, strength, score, message }
}

/**
 * Get human-readable requirement labels
 */
export const PASSWORD_REQUIREMENTS = [
  { key: 'hasMinLength', label: 'At least 8 characters' },
  { key: 'hasUpperCase', label: 'One uppercase letter (A-Z)' },
  { key: 'hasLowerCase', label: 'One lowercase letter (a-z)' },
  { key: 'hasNumber', label: 'One number (0-9)' },
  { key: 'hasSpecialChar', label: 'One special character (!@#$%^&*)' },
] as const

/**
 * Get strength label based on score
 */
export function getStrengthLabel(score: number): string {
  switch (score) {
    case 5:
      return 'Strong'
    case 4:
      return 'Good'
    case 3:
      return 'Fair'
    case 2:
      return 'Weak'
    case 1:
      return 'Very Weak'
    default:
      return ''
  }
}

/**
 * Get strength color class based on score
 */
export function getStrengthColor(score: number): string {
  switch (score) {
    case 5:
      return 'text-forest'
    case 4:
      return 'text-forest'
    case 3:
      return 'text-amber-token'
    case 2:
      return 'text-amber-token'
    case 1:
      return 'text-vermillion'
    default:
      return 'text-ink-4'
  }
}

/**
 * Get progress bar color class based on score
 */
export function getStrengthBarColor(score: number): string {
  switch (score) {
    case 5:
      return 'bg-forest'
    case 4:
      return 'bg-forest'
    case 3:
      return 'bg-amber-token'
    case 2:
      return 'bg-amber-token'
    case 1:
      return 'bg-vermillion'
    default:
      return 'bg-surface-3'
  }
}
