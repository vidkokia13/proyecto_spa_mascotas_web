<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useServiciosStore } from '@/presentation/stores/servicios.store'
import { useUiStore }        from '@/presentation/stores/ui.store'
import { checklistDatasource } from '@/data/datasources/ChecklistDatasource'
import BaseCard    from '@/presentation/components/ui/BaseCard.vue'
import BaseButton  from '@/presentation/components/ui/BaseButton.vue'
import BaseBadge   from '@/presentation/components/ui/BaseBadge.vue'
import BaseModal   from '@/presentation/components/ui/BaseModal.vue'
import type { Servicio, CreateServicioPayload, ChecklistItem } from '@/shared/types/agenda.types'

const store   = useServiciosStore()
const uiStore = useUiStore()

// ── Checklist por servicio ────────────────────────────────────────────────────
const expandedService  = ref<string | null>(null)
const checklistItems   = ref<Record<string, ChecklistItem[]>>({})
const checklistLoading = ref(false)
const newItemDescs     = ref<Record<string, string>>({})

async function toggleChecklist(idServicio: string) {
  if (expandedService.value === idServicio) {
    expandedService.value = null
    return
  }
  expandedService.value = idServicio
  checklistLoading.value = true
  try {
    const res = await checklistDatasource.getItems()
    checklistItems.value[idServicio] = res.items.filter(i => i.id_servicio === idServicio)
  } catch {
    checklistItems.value[idServicio] = []
  } finally {
    checklistLoading.value = false
  }
}

async function addChecklistItem(idServicio: string) {
  const desc = (newItemDescs.value[idServicio] ?? '').trim()
  if (!desc) return
  try {
    const items = checklistItems.value[idServicio] ?? []
    const res = await checklistDatasource.createItem({
      descripcion: desc,
      orden:       items.length + 1,
      idServicio,
    })
    checklistItems.value[idServicio] = [...items, res.item]
    newItemDescs.value[idServicio] = ''
    uiStore.showToast('Ítem agregado', 'success')
  } catch {
    uiStore.showToast('Error al agregar ítem', 'error')
  }
}

async function toggleItemActivo(idServicio: string, item: ChecklistItem) {
  try {
    const res = await checklistDatasource.updateItem(item.id_item, { activo: !item.activo })
    const idx = checklistItems.value[idServicio]?.findIndex(i => i.id_item === item.id_item)
    if (idx !== undefined && idx !== -1) checklistItems.value[idServicio][idx] = res.item
    uiStore.showToast(item.activo ? 'Ítem desactivado' : 'Ítem activado', 'success')
  } catch {
    uiStore.showToast('Error al actualizar ítem', 'error')
  }
}

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
            <BaseButton size="sm" variant="secondary" @click="toggleChecklist(s.id_servicio)">
              {{ expandedService === s.id_servicio ? 'Ocultar checklist' : 'Checklist' }}
            </BaseButton>
            <BaseButton size="sm" variant="secondary" @click="openEdit(s)">Editar</BaseButton>
            <BaseButton size="sm" :variant="s.activo ? 'danger' : 'primary'" :disabled="store.loading"
              @click="toggleActivo(s)">
              {{ s.activo ? 'Desactivar' : 'Activar' }}
            </BaseButton>
          </div>
        </div>

        <!-- ── Checklist expandible ── -->
        <div v-if="expandedService === s.id_servicio" class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ítems del checklist</p>

          <div v-if="checklistLoading" class="text-sm text-gray-400">Cargando…</div>

          <div v-else>
            <ul v-if="checklistItems[s.id_servicio]?.length" class="space-y-2 mb-3">
              <li v-for="item in checklistItems[s.id_servicio]" :key="item.id_item"
                class="flex items-center justify-between gap-3 text-sm">
                <span :class="item.activo ? 'text-gray-800 dark:text-gray-200' : 'line-through text-gray-400'">
                  {{ item.orden }}. {{ item.descripcion }}
                </span>
                <button class="text-xs text-gray-400 hover:text-red-500 transition flex-shrink-0"
                  @click="toggleItemActivo(s.id_servicio, item)">
                  {{ item.activo ? 'Quitar' : 'Activar' }}
                </button>
              </li>
            </ul>
            <p v-else class="text-sm text-gray-400 italic mb-3">Sin ítems configurados.</p>

            <!-- Agregar ítem -->
            <div class="flex gap-2">
              <input v-model="newItemDescs[s.id_servicio]" type="text" placeholder="Ej: Baño con shampoo medicado…"
                class="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                @keyup.enter="addChecklistItem(s.id_servicio)" />
              <BaseButton size="sm" :disabled="!(newItemDescs[s.id_servicio] ?? '').trim()" @click="addChecklistItem(s.id_servicio)">
                + Agregar
              </BaseButton>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <BaseModal :open="showModal" :title="isEdit ? 'Editar servicio' : 'Nuevo servicio'" @close="showModal = false">
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
