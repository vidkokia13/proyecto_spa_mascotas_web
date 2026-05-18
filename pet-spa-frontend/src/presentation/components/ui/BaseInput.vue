<script setup lang="ts">
defineProps<{
  label?:       string
  error?:       string
  hint?:        string
  type?:        string
  placeholder?: string
  disabled?:    boolean
  required?:    boolean
  modelValue:   string | number | null | undefined
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" class="text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>
    <input
      :type="type ?? 'text'"
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      class="block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed
        border-gray-300 bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500
        dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-primary-400 dark:focus:ring-primary-400"
      :class="error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="text-xs text-red-600 dark:text-red-400">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-gray-500 dark:text-gray-400">{{ hint }}</p>
  </div>
</template>
