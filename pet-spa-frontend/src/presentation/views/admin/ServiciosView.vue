<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useServiciosStore } from '@/presentation/stores/servicios.store'
import { useUiStore }        from '@/presentation/stores/ui.store'
import BaseCard    from '@/presentation/components/ui/BaseCard.vue'
import BaseButton  from '@/presentation/components/ui/BaseButton.vue'
import BaseBadge   from '@/presentation/components/ui/BaseBadge.vue'
import BaseModal   from '@/presentation/components/ui/BaseModal.vue'
import type { Servicio, CreateServicioPayload } from '@/shared/types/agenda.types'

const store   = useServiciosStore()
const uiStore = useUiStore()

const showModal = ref(false)
const editId    = ref<string | null>(null)

const form = ref<CreateServicioPayload & { activo?: boolean }>({
  nombre: '', descripcion: null, duracionBase: 30, precioBase: 0, categoria: null,
})

const isEdit = computed(() => !!editId.value)

function openCreate() {
  editId.value = null
  form.value = { nombre: '', descripcion: null, duracionBase: 30, precioBase: 0, categoria: null }
  showModal.value = true
}

function openEdit(s: Servicio) {
  editId.value = s.id_servicio
  form.value = {
    nombre:       s.nombre,
    descripcion:  s.descripcion,
    duracionBase: s.duracion_base,
    precioBase:   s.precio_base,
    categoria:    s.categoria,
    activo:       s.activo,
  }
  showModal.value = true
}

async function submit() {
  try {
    if (isEdit.value) {
      await store.update(editId.value!, form.value)
      uiStore.showToast('Servicio actualizado', 'success')
    } else {
      await store.create(form.value)
      uiStore.showToast('Servicio creado', 'success')
    }
    showModal.value = false
  } catch {
    uiStore.showToast(store.error ?? 'Error', 'error')
  }
}

async function toggleActivo(s: Servicio) {
  try {
    await store.update(s.id_servicio, { activo: !s.activo })
    uiStore.showToast(s.activo ? 'Servicio desactivado' : 'Servicio activado', 'success')
  } catch {
    uiStore.showToast(store.error ?? 'Error', 'error')
  }
}

onMounted(() => store.fetchAll(false))
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Catálogo de servicios</h1>
      <BaseButton @click="openCreate">+ Nuevo servicio</BaseButton>
    </div>

    <div v-if="store.loading && store.servicios.length === 0" class="text-center py-16 text-gray-400">Cargando…</div>

    <div v-else class="space-y-3">
      <BaseCard v-for="s in store.servicios" :key="s.id_servicio">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="font-semibold text-gray-900 dark:text-white">{{ s.nombre }}</span>
              <BaseBadge :color="s.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'">
                {{ s.activo ? 'Activo' : 'Inactivo' }}
              </BaseBadge>
              <BaseBadge v-if="s.categoria" color="bg-purple-100 text-purple-700">{{ s.categoria }}</BaseBadge>
            </div>
            <p v-if="s.descripcion" class="text-sm text-gray-500 dark:text-gray-400">{{ s.descripcion }}</p>
            <div class="flex gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span>Duración: {{ s.duracion_base }} min</span>
              <span>Precio base: ${{ Number(s.precio_base).toLocaleString('es-CL') }}</span>
            </div>
          </div>
          <div class="flex gap-2">
            <BaseButton size="sm" variant="secondary" @click="openEdit(s)">Editar</BaseButton>
            <BaseButton size="sm" :variant="s.activo ? 'danger' : 'primary'" :disabled="store.loading"
              @click="toggleActivo(s)">
              {{ s.activo ? 'Desactivar' : 'Activar' }}
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <BaseModal :show="showModal" :title="isEdit ? 'Editar servicio' : 'Nuevo servicio'" @close="showModal = false">
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Nombre *</label>
          <input v-model="form.nombre" type="text" placeholder="Ej: Baño y corte completo"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Descripción</label>
          <textarea v-model="form.descripcion" rows="2"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Duración base (min) *</label>
            <input v-model.number="form.duracionBase" type="number" min="5" step="5"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Precio base ($)</label>
            <input v-model.number="form.precioBase" type="number" min="0" step="0.01"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          </div>
        </div>
        <div>
          <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Categoría</label>
          <input v-model="form.categoria" type="text" placeholder="Ej: grooming, veterinaria…"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
        </div>
        <div class="flex gap-2 justify-end pt-2">
          <BaseButton variant="secondary" size="sm" @click="showModal = false">Cancelar</BaseButton>
          <BaseButton size="sm" :disabled="!form.nombre || store.loading" @click="submit">
            {{ isEdit ? 'Guardar' : 'Crear' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
