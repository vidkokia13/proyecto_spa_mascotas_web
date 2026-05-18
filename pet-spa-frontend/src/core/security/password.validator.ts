const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

export interface PasswordStrength {
  score: number
  label: string
  color: string
  checks: {
    minLength:   boolean
    hasLower:    boolean
    hasUpper:    boolean
    hasNumber:   boolean
    hasSymbol:   boolean
  }
}

export function analyzePassword(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 8,
    hasLower:  /[a-z]/.test(password),
    hasUpper:  /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  }

  const score = Object.values(checks).filter(Boolean).length

  const labels = ['', 'Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte']
  const colors = [
    '',
    'bg-red-500',
    'bg-orange-400',
    'bg-yellow-400',
    'bg-lime-500',
    'bg-green-500',
  ]

  return {
    score,
    label: labels[score] ?? '',
    color: colors[score] ?? '',
    checks,
  }
}

export function isPasswordValid(password: string): boolean {
  return STRONG_PASSWORD.test(password)
}

export const PASSWORD_RULES = [
  { key: 'minLength', label: 'Mínimo 8 caracteres'    },
  { key: 'hasLower',  label: 'Al menos una minúscula' },
  { key: 'hasUpper',  label: 'Al menos una mayúscula' },
  { key: 'hasNumber', label: 'Al menos un número'     },
  { key: 'hasSymbol', label: 'Al menos un símbolo'    },
] as const
