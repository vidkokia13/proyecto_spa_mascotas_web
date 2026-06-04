<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BaseCard  from '@/presentation/components/ui/BaseCard.vue'
import BaseBadge from '@/presentation/components/ui/BaseBadge.vue'
import * as ds from '@/data/datasources/ReporteDatasource'
import type { PromocionUsada, PromocionDisponible } from '@/shared/types/agenda.types'

const loading     = ref(false)
const usadas      = ref<PromocionUsada[]>([])
const disponibles = ref<PromocionDisponible[]>([])

onMounted(async () => {
  loading.value = true
  try {
    const res = await ds.fetchMisPromociones()
    usadas.value      = res.usadas
    disponibles.value = res.disponibles
  } finally { loading.value = false }
})

const bs  = (n: number | string) => `Bs ${Number(n).toFixed(2)}`
const pct = (tipo: string, valor: number) =>
  tipo === 'porcentaje' ? `${valor}% de descuento` : `Bs ${valor} de descuento`
</script>

<template>
  <div class="p-6 max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mis promociones</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Descuentos usados y promociones vigentes</p>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-400">Cargando...</div>

    <template v-else>
      <!-- Disponibles -->
      <div v-if="disponibles.length">
        <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Promociones vigentes</h2>
        <div class="space-y-3">
          <div
            v-for="p in disponibles" :key="p.id_promocion"
            class="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-2xl border border-primary-100 dark:border-primary-800 p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-semibold text-gray-900 dark:text-white">{{ p.nombre }}</p>
                <p v-if="p.descripcion" class="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{{ p.descripcion }}</p>
                <p class="text-sm font-medium text-primary-700 dark:text-primary-400 mt-1">{{ pct(p.tipo, p.valor) }}</p>
                <p v-if="p.codigo" class="mt-2">
                  <span class="font-mono text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-lg">{{ p.codigo }}</span>
                </p>
              </div>
              <BaseBadge color="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Vigente</BaseBadge>
            </div>
            <p class="text-xs text-gray-400 mt-2">Válida hasta {{ new Date(p.fecha_fin).toLocaleDateString('es-BO') }}</p>
          </div>
        </div>
      </div>
      <div v-else class="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 text-center">
        <p class="text-sm text-gray-500 dark:text-gray-400">No hay promociones disponibles en este momento</p>
      </div>

      <!-- Usadas -->
      <div>
        <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Historial de descuentos</h2>
        <div v-if="!usadas.length" class="text-center py-6 text-sm text-gray-400">No has usado ninguna promoción aún</div>
        <BaseCard v-else>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100 dark:border-gray-700">
                  <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Promoción</th>
                  <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Servicio</th>
                  <th class="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Monto</th>
                  <th class="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Ahorro</th>
                  <th class="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Fecha</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="u in usadas" :key="u.creado_en"
                  class="border-b border-gray-50 dark:border-gray-800"
                >
                  <td class="py-2 px-3">
                    <p class="font-medium text-gray-900 dark:text-white">{{ u.promocion }}</p>
                    <p v-if="u.codigo" class="font-mono text-xs text-gray-400">{{ u.codigo }}</p>
                  </td>
                  <td class="py-2 px-3 text-gray-600 dark:text-gray-400">{{ u.servicio }}</td>
                  <td class="py-2 px-3 text-right font-medium">{{ bs(u.monto) }}</td>
                  <td class="py-2 px-3 text-right font-semibold text-green-600 dark:text-green-400">-{{ bs(u.descuento_aplicado) }}</td>
                  <td class="py-2 px-3 text-right text-gray-400 text-xs whitespace-nowrap">
                    {{ new Date(u.creado_en).toLocaleDateString('es-BO') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>
      </div>
    </template>
  </div>
</template>
