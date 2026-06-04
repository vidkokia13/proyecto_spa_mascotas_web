<script setup lang="ts" generic="T extends Record<string, unknown>">
defineProps<{
  columns: { key: string; label: string; class?: string }[]
  rows:    T[]
  loading?: boolean
  emptyText?: string
}>()
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead class="bg-gray-50 dark:bg-gray-800/80">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="['px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider', col.class]"
          >
            {{ col.label }}
          </th>
          <th v-if="$slots.actions" class="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Acciones
          </th>
        </tr>
      </thead>
      <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
        <template v-if="loading">
          <tr v-for="i in 4" :key="i">
            <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="px-5 py-4">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </td>
          </tr>
        </template>
        <template v-else-if="rows.length === 0">
          <tr>
            <td
              :colspan="columns.length + ($slots.actions ? 1 : 0)"
              class="px-5 py-12 text-center text-gray-400 dark:text-gray-600 text-sm"
            >
              {{ emptyText ?? 'Sin resultados' }}
            </td>
          </tr>
        </template>
        <template v-else>
          <tr v-for="(row, i) in rows" :key="i" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
            <td
              v-for="col in columns"
              :key="col.key"
              class="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300"
            >
              <slot :name="col.key" :row="row">
                {{ (row as Record<string, unknown>)[col.key] ?? '—' }}
              </slot>
            </td>
            <td v-if="$slots.actions" class="px-5 py-3.5 text-right">
              <slot name="actions" :row="row" />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
