<script setup lang="ts">
defineProps<{
  title?:    string
  subtitle?: string
  padding?:  boolean
}>()
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div v-if="title" class="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
      <h3 class="font-semibold text-gray-900 dark:text-white text-base leading-tight">{{ title }}</h3>
      <p v-if="subtitle" class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ subtitle }}</p>
    </div>
    <div :class="padding === false ? '' : 'px-6 py-5'">
      <slot />
    </div>
  </div>
</template>
