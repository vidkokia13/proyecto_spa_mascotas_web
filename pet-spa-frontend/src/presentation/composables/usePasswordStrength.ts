import { computed } from 'vue'
import { analyzePassword, isPasswordValid, type PasswordStrength } from '@/core/security/password.validator'

export function usePasswordStrength(passwordRef: { value: string }) {
  const strength = computed<PasswordStrength>(() => analyzePassword(passwordRef.value))
  const isValid  = computed(() => isPasswordValid(passwordRef.value))

  const barWidth = computed(() => {
    const pct = (strength.value.score / 5) * 100
    return `${pct}%`
  })

  return { strength, isValid, barWidth }
}
