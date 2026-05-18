<script setup lang="ts">
import { toRef } from 'vue'
import { usePasswordStrength } from '@/presentation/composables/usePasswordStrength'
import { PASSWORD_RULES } from '@/core/security/password.validator'

const props = defineProps<{ password: string }>()

const pwRef = toRef(props, 'password')
const { strength, barWidth } = usePasswordStrength(pwRef)
</script>

<template>
  <div class="space-y-2 mt-2">
    <div class="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-300"
        :class="strength.color"
        :style="{ width: barWidth }"
      />
    </div>
    <p v-if="password" class="text-xs font-medium" :class="{
      'text-red-500': strength.score <= 2,
      'text-yellow-500': strength.score === 3,
      'text-green-500': strength.score >= 4,
    }">
      {{ strength.label }}
    </p>
    <ul class="space-y-0.5">
      <li
        v-for="rule in PASSWORD_RULES"
        :key="rule.key"
        class="flex items-center gap-1.5 text-xs"
        :class="strength.checks[rule.key] ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'"
      >
        <svg v-if="strength.checks[rule.key]" class="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        <svg v-else class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="9" stroke-width="2" />
        </svg>
        {{ rule.label }}
      </li>
    </ul>
  </div>
</template>
