'use strict'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pagoDatasource }      from '@/data/datasources/PagoDatasource'
import { fichaDatasource }     from '@/data/datasources/FichaDatasource'
import { checklistDatasource } from '@/data/datasources/ChecklistDatasource'
import { fotoDatasource }      from '@/data/datasources/FotoDatasource'
import { insumoDatasource }    from '@/data/datasources/InsumoDatasource'
import { extractErrorMessage } from '@/core/errors/AppError'
import type {
  Pago, CreatePagoPayload,
  FichaTecnica, UpsertFichaPayload,
  CitaChecklistEntry,
  Foto, TipoFoto,
  CitaInsumo, RegisterInsumosPayload, UpdateCitaInsumoPayload,
} from '@/shared/types/agenda.types'

export const useDetalleStore = defineStore('detalle', () => {
  const idCitaActual = ref<string | null>(null)
  const loading      = ref(false)
  const error        = ref<string | null>(null)

  // ── Pagos ──
  const pagos = ref<Pago[]>([])

  async function fetchPagos(idCita: string): Promise<void> {
    loading.value = true; error.value = null
    try { pagos.value = (await pagoDatasource.listByCita(idCita)).pagos }
    catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  async function createPago(payload: CreatePagoPayload): Promise<void> {
    loading.value = true; error.value = null
    try { pagos.value.push((await pagoDatasource.create(payload)).pago) }
    catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  async function removePago(id: string): Promise<void> {
    loading.value = true; error.value = null
    try {
      await pagoDatasource.remove(id)
      pagos.value = pagos.value.filter(p => p.id_pago !== id)
    } catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  // ── Ficha técnica ──
  const ficha = ref<FichaTecnica | null>(null)

  async function fetchFicha(idCita: string): Promise<void> {
    loading.value = true; error.value = null
    try { ficha.value = (await fichaDatasource.getByCita(idCita)).ficha }
    catch (e) {
      if ((e as any)?.response?.status === 404) { ficha.value = null }
      else { error.value = extractErrorMessage(e); throw e }
    }
    finally { loading.value = false }
  }

  async function upsertFicha(payload: UpsertFichaPayload): Promise<void> {
    loading.value = true; error.value = null
    try { ficha.value = (await fichaDatasource.upsert(payload)).ficha }
    catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  // ── Checklist ──
  const checklist = ref<CitaChecklistEntry[]>([])

  async function fetchChecklist(idCita: string): Promise<void> {
    loading.value = true; error.value = null
    try { checklist.value = (await checklistDatasource.getByCita(idCita)).checklist }
    catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  async function toggleChecklistItem(idCita: string, idItem: string, completado: boolean): Promise<void> {
    error.value = null
    try {
      const idx = checklist.value.findIndex(i => i.id_item === idItem)
      if (idx !== -1) checklist.value[idx] = { ...checklist.value[idx], completado }
      await checklistDatasource.toggleItem(idCita, idItem, completado)
      const updated = (await checklistDatasource.getByCita(idCita)).checklist
      checklist.value = updated
    } catch (e) { error.value = extractErrorMessage(e); throw e }
  }

  // ── Fotos ──
  const fotos = ref<Foto[]>([])

  async function fetchFotos(idCita: string): Promise<void> {
    loading.value = true; error.value = null
    try { fotos.value = (await fotoDatasource.listByCita(idCita)).fotos }
    catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  async function uploadFoto(idCita: string, file: File, tipo: TipoFoto): Promise<void> {
    loading.value = true; error.value = null
    try { fotos.value.push((await fotoDatasource.upload(idCita, file, tipo)).foto) }
    catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  async function removeFoto(id: string): Promise<void> {
    loading.value = true; error.value = null
    try {
      await fotoDatasource.remove(id)
      fotos.value = fotos.value.filter(f => f.id_foto !== id)
    } catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  // ── Insumos ──
  const citaInsumos = ref<CitaInsumo[]>([])

  async function fetchCitaInsumos(idCita: string): Promise<void> {
    loading.value = true; error.value = null
    try { citaInsumos.value = (await insumoDatasource.listByCita(idCita)).insumos }
    catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  async function registerInsumos(payload: RegisterInsumosPayload): Promise<void> {
    loading.value = true; error.value = null
    try {
      const res = await insumoDatasource.registerForCita(payload)
      citaInsumos.value.push(...res.insumos)
    } catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  async function updateCitaInsumo(id: string, payload: UpdateCitaInsumoPayload): Promise<void> {
    loading.value = true; error.value = null
    try {
      const res = await insumoDatasource.updateCitaInsumo(id, payload)
      const idx = citaInsumos.value.findIndex(i => i.id_cita_insumo === id)
      if (idx !== -1) citaInsumos.value[idx] = res.insumo
    } catch (e) { error.value = extractErrorMessage(e); throw e }
    finally { loading.value = false }
  }

  async function loadAll(idCita: string): Promise<void> {
    idCitaActual.value = idCita
    await Promise.allSettled([
      fetchPagos(idCita),
      fetchFicha(idCita),
      fetchChecklist(idCita),
      fetchFotos(idCita),
      fetchCitaInsumos(idCita),
    ])
  }

  function reset(): void {
    idCitaActual.value = null
    pagos.value        = []
    ficha.value        = null
    checklist.value    = []
    fotos.value        = []
    citaInsumos.value  = []
    error.value        = null
  }

  return {
    idCitaActual, loading, error,
    pagos, ficha, checklist, fotos, citaInsumos,
    fetchPagos, createPago, removePago,
    fetchFicha, upsertFicha,
    fetchChecklist, toggleChecklistItem,
    fetchFotos, uploadFoto, removeFoto,
    fetchCitaInsumos, registerInsumos, updateCitaInsumo,
    loadAll, reset,
  }
})
