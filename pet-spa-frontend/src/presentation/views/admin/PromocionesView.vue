<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePromociones } from '@/presentation/composables/usePromociones'
import BaseCard   from '@/presentation/components/ui/BaseCard.vue'
import BaseButton from '@/presentation/components/ui/BaseButton.vue'
import BaseBadge  from '@/presentation/components/ui/BaseBadge.vue'
import BaseModal  from '@/presentation/components/ui/BaseModal.vue'
import type { Promocion, CreatePromocionPayload, TipoPromocion } from '@/shared/types/agenda.types'

const { store, loadAll, createPromocion, updatePromocion, eliminarPromocion } = usePromociones()

const showModal = ref(false)
const editId    = ref<string | null>(null)
const filtroActivas = ref(false)

const form = ref<CreatePromocionPayload & { activo?: boolean }>({
  nombre: '', descripcion: null, tipo: 'porcentaje', valor: 0,
  codigo: null, fechaInicio: '', fechaFin: '',
})

const isEdit = computed(() => !!editId.value)

const hoy = new Date().toISOString().slice(0, 10)

function openCreate() {
  editId.value = null
  form.value = { nombre: '', descripcion: null, tipo: 'porcentaje', valor: 0, codigo: null, fechaInicio: hoy, fechaFin: '' }
  showModal.value = true
}

function openEdit(p: Promocion) {
  editId.value = p.id_promocion
  form.value = {
    nombre:      p.nombre,
    descripcion: p.descripcion,
    tipo:        p.tipo,
    valor:       p.valor,
    codigo:      p.codigo,
    fechaInicio: p.fecha_inicio,
    fechaFin:    p.fecha_fin,
    activo:      p.activo,
  }
  showModal.value = true
}

async function submit() {
  const payload = {
    ...form.value,
    codigo: form.value.codigo?.trim() || null,
    descripcion: form.value.descripcion?.trim() || null,
  }
  let ok: boolean
  if (isEdit.value) {
    ok = await updatePromocion(editId.value!, payload)
  } else {
    ok = await createPromocion(payload as CreatePromocionPayload)
  }
  if (ok) showModal.value = false
}

async function onEliminar(p: Promocion) {
  if (!confirm(`¿Desactivar la promoción "${p.nombre}"?`)) return
  await eliminarPromocion(p.id_promocion)
}

function tipoLabel(tipo: TipoPromocion) {
  return tipo === 'porcentaje' ? '%' : '$'
}

function valorDisplay(p: Promocion) {
  return p.tipo === 'porcentaje'
    ? `${p.valor}%`
    : `$${Number(p.valor).toLocaleString('es-CL')}`
}

function isVigente(p: Promocion): boolean {
  const now = hoy
  return p.activo && p.fecha_inicio <= now && p.fecha_fin >= now
}

onMounted(() => loadAll())
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Promociones</h1>
      <div class="flex items-center gap-3">
        <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
          <input type="checkbox" v-model="filtroActivas" class="rounded text-primary-600" @change="loadAll(!filtroActivas)" />
          Solo activas
        </label>
        <BaseButton size="sm" @click="openCreate">+ Nueva promoción</BaseButton>
      </div>
    </div>

    <div v-if="store.loading && store.promociones.length === 0" class="text-center py-12 text-gray-400">Cargando…</div>

    <div v-else-if="store.promociones.length === 0" class="text-center py-10">
      <p class="text-gray-500">No hay promociones registradas.</p>
    </div>

    <div v-else class="space-y-3">
      <BaseCard v-for="p in store.promociones" :key="p.id_promocion">
        <div class="flex items-start gap-4 flex-wrap">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="font-semibold text-gray-900 dark:text-white">{{ p.nombre }}</span>
              <BaseBadge :color="isVigente(p) ? 'bg-green-100 text-green-800' : p.activo ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500'">
                {{ isVigente(p) ? 'Vigente' : p.activo ? 'Inactiva' : 'Desactivada' }}
              </BaseBadge>
              <span v-if="p.codigo"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300">
                {{ p.codigo }}
              </span>
            </div>
            <p v-if="p.descripcion" class="text-sm text-gray-500 dark:text-gray-400 mb-1">{{ p.descripcion }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Descuento: <span class="font-semibold text-primary-600 dark:text-primary-400">{{ valorDisplay(p) }}</span>
              ({{ p.tipo === 'porcentaje' ? 'porcentaje' : 'monto fijo' }})
            </p>
            <p class="text-xs text-gray-400 mt-1">
              Válida del {{ p.fecha_inicio }} al {{ p.fecha_fin }}
            </p>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <BaseButton size="sm" variant="secondary" @click="openEdit(p)">Editar</BaseButton>
            <BaseButton v-if="p.activo" size="sm" variant="danger" @click="onEliminar(p)">Desactivar</BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Modal crear/editar -->
    <BaseModal :show="showModal" :title="isEdit ? 'Editar promoción' : 'Nueva promoción'" @close="showModal = false">
      <div class="space-y-4">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Nombre *</label>
          <input v-model="form.nombre" type="text" maxlength="100" placeholder="Ej: Descuento verano"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
        </div>

        <div>
          <label class="block text-xs text-gray-500 mb-1">Descripción</label>
          <textarea v-model="form.descripcion" rows="2" placeholder="Descripción opcional…"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Tipo *</label>
            <select v-model="form.tipo"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="monto_fijo">Monto fijo ($)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">
              Valor * {{ form.tipo === 'porcentaje' ? '(máx 100)' : '(CLP)' }}
            </label>
            <input v-model.number="form.valor" type="number" min="0.01" step="0.01"
              :max="form.tipo === 'porcentaje' ? 100 : undefined"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          </div>
        </div>

        <div>
          <label class="block text-xs text-gray-500 mb-1">Código de promoción (opcional)</label>
          <input v-model="form.codigo" type="text" maxlength="30" placeholder="Ej: VERANO2025"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none uppercase"
            @input="form.codigo = (form.codigo ?? '').toUpperCase()" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Fecha inicio *</label>
            <input v-model="form.fechaInicio" type="date"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Fecha fin *</label>
            <input v-model="form.fechaFin" type="date" :min="form.fechaInicio"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          </div>
        </div>

        <div v-if="isEdit" class="flex items-center gap-2">
          <input id="promo-activo" type="checkbox" v-model="form.activo"
            class="rounded text-primary-600 focus:ring-primary-500" />
          <label for="promo-activo" class="text-sm text-gray-700 dark:text-gray-300">Activa</label>
        </div>

        <div class="flex gap-2 justify-end pt-2">
          <BaseButton variant="secondary" size="sm" @click="showModal = false">Cancelar</BaseButton>
          <BaseButton size="sm"
            :disabled="!form.nombre || !form.valor || !form.fechaInicio || !form.fechaFin || store.loading"
            @click="submit">
            {{ isEdit ? 'Guardar cambios' : 'Crear promoción' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
