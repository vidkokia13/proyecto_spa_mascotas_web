<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useInsumosStore } from '@/presentation/stores/insumos.store'
import { useUiStore }      from '@/presentation/stores/ui.store'
import BaseCard    from '@/presentation/components/ui/BaseCard.vue'
import BaseButton  from '@/presentation/components/ui/BaseButton.vue'
import BaseBadge   from '@/presentation/components/ui/BaseBadge.vue'
import BaseModal   from '@/presentation/components/ui/BaseModal.vue'
import type { Insumo, CreateInsumoPayload } from '@/shared/types/agenda.types'

const store   = useInsumosStore()
const uiStore = useUiStore()

const activeTab = ref<'catalogo' | 'log'>('catalogo')

// ── Log filters ───────────────────────────────────────────────────────────────
const logFiltroFecha       = ref('')
const logFiltroTrabajador  = ref('')

async function cargarLog() {
  await store.fetchLog({
    fecha:        logFiltroFecha.value      || undefined,
    idTrabajador: logFiltroTrabajador.value || undefined,
  })
}

function fmtFechaLog(iso: string) {
  return new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
}

const showModal = ref(false)
const editId    = ref<string | null>(null)
const form      = ref<CreateInsumoPayload & { activo?: boolean; stock_minimo?: number }>({
  nombre: '', unidad: '', stock: 0, stockMinimo: 5,
})

const isEdit      = computed(() => !!editId.value)
const hayAlertas  = computed(() => store.alertas.length > 0)
const hayPredicciones = computed(() => store.predicciones.length > 0)

function openCreate() {
  editId.value = null
  form.value = { nombre: '', unidad: '', stock: 0, stockMinimo: 5 }
  showModal.value = true
}

function openEdit(ins: Insumo) {
  editId.value = ins.id_insumo
  form.value = {
    nombre: ins.nombre, unidad: ins.unidad, stock: ins.stock,
    stockMinimo: ins.stock_minimo, activo: ins.activo,
  }
  showModal.value = true
}

async function submit() {
  try {
    if (isEdit.value) {
      await store.update(editId.value!, {
        nombre: form.value.nombre, unidad: form.value.unidad,
        stock: form.value.stock, stock_minimo: form.value.stockMinimo,
        activo: form.value.activo,
      })
      uiStore.showToast('Insumo actualizado', 'success')
    } else {
      await store.create(form.value)
      uiStore.showToast('Insumo creado', 'success')
    }
    showModal.value = false
    await store.fetchAlertas()
  } catch {
    uiStore.showToast(store.error ?? 'Error', 'error')
  }
}

async function toggleActivo(ins: Insumo) {
  try {
    await store.update(ins.id_insumo, { activo: !ins.activo })
    uiStore.showToast(ins.activo ? 'Insumo desactivado' : 'Insumo activado', 'success')
  } catch {
    uiStore.showToast(store.error ?? 'Error', 'error')
  }
}

function stockColor(ins: Insumo) {
  if (ins.stock === 0)                  return 'bg-red-100 text-red-800'
  if (ins.stock <= ins.stock_minimo)    return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

onMounted(async () => {
  await Promise.all([store.fetchAll(), store.fetchAlertas(), store.fetchLog(), store.fetchPrediccion()])
})
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Gestión de insumos</h1>
      <BaseButton v-if="activeTab === 'catalogo'" @click="openCreate">+ Nuevo insumo</BaseButton>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-5 border-b border-gray-200 dark:border-gray-700">
      <button
        v-for="tab in [{ key: 'catalogo', label: 'Catálogo' }, { key: 'log', label: 'Log de salidas' }]"
        :key="tab.key"
        class="px-4 py-2 text-sm font-medium transition-colors"
        :class="activeTab === tab.key
          ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'"
        @click="activeTab = (tab.key as 'catalogo' | 'log')"
      >{{ tab.label }}</button>
    </div>

    <!-- ── TAB: Catálogo ── -->
    <template v-if="activeTab === 'catalogo'">
      <!-- Banner alertas de bajo stock -->
      <div v-if="hayAlertas"
        class="mb-5 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
        <span class="text-red-500 text-lg">⚠</span>
        <div>
          <p class="font-semibold text-red-700 dark:text-red-400 text-sm">
            {{ store.alertas.length }} insumo{{ store.alertas.length !== 1 ? 's' : '' }} con stock bajo o agotado
          </p>
          <ul class="mt-1 space-y-0.5">
            <li v-for="a in store.alertas" :key="a.id_insumo" class="text-xs text-red-600 dark:text-red-400">
              <strong>{{ a.nombre }}</strong>: {{ a.stock }} {{ a.unidad }} (mín. {{ a.stock_minimo }})
            </li>
          </ul>
        </div>
      </div>

      <!-- Banner predicciones de consumo elevado -->
      <div v-if="hayPredicciones"
        class="mb-5 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 flex items-start gap-3">
        <span class="text-orange-500 text-lg mt-0.5">📊</span>
        <div class="flex-1">
          <p class="font-semibold text-orange-700 dark:text-orange-400 text-sm mb-1">
            Alertas de consumo — {{ store.predicciones.length }} insumo{{ store.predicciones.length !== 1 ? 's' : '' }} con riesgo
          </p>
          <ul class="space-y-1">
            <li v-for="p in store.predicciones" :key="p.id_insumo" class="text-xs text-orange-700 dark:text-orange-300">
              <strong>{{ p.nombre }}</strong>
              (stock: {{ p.stock }} {{ p.unidad }}{{ p.servicios_restantes !== null ? ` · ~${p.servicios_restantes} servicios restantes` : '' }})
              <span v-for="a in p.alertas" :key="a.tipo"
                class="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium"
                :class="a.tipo === 'consumo_elevado' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'">
                {{ a.tipo === 'consumo_elevado' ? '↑ Consumo elevado' : '⚠ Stock crítico' }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div v-if="store.loading && store.insumos.length === 0" class="text-center py-16 text-gray-400">Cargando…</div>

      <div v-else class="space-y-3">
        <BaseCard v-for="ins in store.insumos" :key="ins.id_insumo">
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="font-semibold text-gray-900 dark:text-white">{{ ins.nombre }}</span>
                <BaseBadge :color="ins.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'">
                  {{ ins.activo ? 'Activo' : 'Inactivo' }}
                </BaseBadge>
              </div>
              <div class="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Unidad: <strong class="text-gray-900 dark:text-white">{{ ins.unidad }}</strong></span>
                <span class="flex items-center gap-1">
                  Stock:
                  <BaseBadge :color="stockColor(ins)">{{ ins.stock }}</BaseBadge>
                  <span class="text-xs text-gray-400">(mín. {{ ins.stock_minimo }})</span>
                </span>
              </div>
            </div>
            <div class="flex gap-2">
              <BaseButton size="sm" variant="secondary" @click="openEdit(ins)">Editar</BaseButton>
              <BaseButton size="sm" :variant="ins.activo ? 'danger' : 'primary'" :disabled="store.loading"
                @click="toggleActivo(ins)">
                {{ ins.activo ? 'Desactivar' : 'Activar' }}
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>
    </template>

    <!-- ── TAB: Log de salidas ── -->
    <template v-else-if="activeTab === 'log'">
      <BaseCard class="mb-4">
        <div class="flex gap-3 flex-wrap items-end">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Fecha</label>
            <input v-model="logFiltroFecha" type="date"
              class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          </div>
          <BaseButton size="sm" variant="secondary" @click="cargarLog">Filtrar</BaseButton>
          <BaseButton size="sm" variant="secondary" @click="logFiltroFecha = ''; logFiltroTrabajador = ''; cargarLog()">Limpiar</BaseButton>
          <span class="text-xs text-gray-400 self-center">{{ store.logRegistros.length }} registros</span>
        </div>
      </BaseCard>

      <div v-if="store.logRegistros.length === 0" class="text-center py-16 text-gray-400">
        Sin registros de salida de insumos.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th class="pb-2 pr-4 font-medium">Fecha</th>
              <th class="pb-2 pr-4 font-medium">Groomer</th>
              <th class="pb-2 pr-4 font-medium">Insumo</th>
              <th class="pb-2 pr-3 font-medium text-right">Recibido</th>
              <th class="pb-2 pr-3 font-medium text-right">Usado</th>
              <th class="pb-2 pr-3 font-medium text-right">Devuelto</th>
              <th class="pb-2 font-medium text-right">Desperdicio</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="r in store.logRegistros" :key="r.id_cita_insumo"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td class="py-2 pr-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ fmtFechaLog(r.creado_en) }}</td>
              <td class="py-2 pr-4 font-medium text-gray-900 dark:text-white">
                {{ r.nombre_groomer ?? '—' }}
              </td>
              <td class="py-2 pr-4 text-gray-700 dark:text-gray-300">
                {{ r.nombre_insumo }}
                <span class="text-xs text-gray-400 ml-1">{{ r.unidad }}</span>
              </td>
              <td class="py-2 pr-3 text-right font-mono text-blue-600 dark:text-blue-400">{{ r.cantidad_recibida }}</td>
              <td class="py-2 pr-3 text-right font-mono text-green-600 dark:text-green-400">{{ r.cantidad_usada }}</td>
              <td class="py-2 pr-3 text-right font-mono text-gray-600 dark:text-gray-400">{{ r.cantidad_devuelta }}</td>
              <td class="py-2 text-right font-mono"
                :class="Number(r.desperdicio) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'">
                {{ r.desperdicio }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <BaseModal :open="showModal" :title="isEdit ? 'Editar insumo' : 'Nuevo insumo'" @close="showModal = false">
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Nombre *</label>
          <input v-model="form.nombre" type="text" placeholder="Ej: Shampoo para mascotas"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Unidad *</label>
            <input v-model="form.unidad" type="text" placeholder="Ej: ml, g, unidad"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Stock {{ isEdit ? 'actual' : 'inicial' }}</label>
            <input v-model.number="form.stock" type="number" min="0" step="0.01"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Stock mínimo</label>
            <input v-model.number="form.stockMinimo" type="number" min="0" step="1"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          </div>
        </div>
        <div class="flex gap-2 justify-end pt-2">
          <BaseButton variant="secondary" size="sm" @click="showModal = false">Cancelar</BaseButton>
          <BaseButton size="sm" :disabled="!form.nombre || !form.unidad || store.loading" @click="submit">
            {{ isEdit ? 'Guardar' : 'Crear' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
