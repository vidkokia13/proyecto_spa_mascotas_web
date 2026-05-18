<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AuthLayout      from '@/presentation/layouts/AuthLayout.vue'
import DashboardLayout from '@/presentation/layouts/DashboardLayout.vue'

const route  = useRoute()
const layout = computed(() => route.meta.layout as string | undefined)
</script>

<template>
  <DashboardLayout v-if="layout === 'dashboard'" />
  <AuthLayout      v-else-if="layout === 'auth'" />
  <router-view     v-else />
</template>
