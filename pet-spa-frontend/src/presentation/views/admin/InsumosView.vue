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

const showModal = ref(false)
const editId    = ref<string | null>(null)
const form      = ref<CreateInsumoPayload & { activo?: boolean }>({ nombre: '', unidad: '', stock: 0 })

const isEdit = computed(() => !!editId.value)

function openCreate() {
  editId.value = null
  form.value = { nombre: '', unidad: '', stock: 0 }
  showModal.value = true
}

function openEdit(ins: Insumo) {
  editId.value = ins.id_insumo
  form.value = { nombre: ins.nombre, unidad: ins.unidad, stock: ins.stock, activo: ins.activo }
  showModal.value = true
}

async function submit() {
  try {
    if (isEdit.value) {
      await store.update(editId.value!, form.value)
      uiStore.showToast('Insumo actualizado', 'success')
    } else {
      await store.create(form.value)
      uiStore.showToast('Insumo creado', 'success')
    }
    showModal.value = false
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

function stockColor(stock: number) {
  if (stock === 0)  return 'bg-red-100 text-red-800'
  if (stock < 5)    return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

onMounted(() => store.fetchAll())
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Catálogo de insumos</h1>
      <BaseButton @click="openCreate">+ Nuevo insumo</BaseButton>
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
                <BaseBadge :color="stockColor(ins.stock)">{{ ins.stock }}</BaseBadge>
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

    <BaseModal :show="showModal" :title="isEdit ? 'Editar insumo' : 'Nuevo insumo'" @close="showModal = false">
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
            <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Stock inicial</label>
            <input v-model.number="form.stock" type="number" min="0" step="0.01"
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
