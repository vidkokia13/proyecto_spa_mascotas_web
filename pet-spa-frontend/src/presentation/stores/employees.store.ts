import { defineStore } from 'pinia'
import { ref } from 'vue'
import { employeeRepository } from '@/data/repositories/EmployeeRepository.impl'
import { extractErrorMessage } from '@/core/errors/AppError'
import type { Employee, CreateEmployeePayload, UpdateEmployeePayload } from '@/shared/types/employee.types'

export const useEmployeesStore = defineStore('employees', () => {
  const employees = ref<Employee[]>([])
  const selected  = ref<Employee | null>(null)
  const loading   = ref(false)
  const error     = ref<string | null>(null)

  async function fetchAll(): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const res       = await employeeRepository.list()
      employees.value = res.employees
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      const res      = await employeeRepository.getOne(id)
      selected.value = res.employee
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(payload: CreateEmployeePayload): Promise<Employee> {
    loading.value = true
    error.value   = null
    try {
      const res = await employeeRepository.create(payload)
      employees.value.unshift(res.employee)
      return res.employee
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, payload: UpdateEmployeePayload): Promise<Employee> {
    loading.value = true
    error.value   = null
    try {
      const res = await employeeRepository.update(id, payload)
      const idx = employees.value.findIndex(e => e.id_usuario === id)
      if (idx !== -1) employees.value[idx] = res.employee
      if (selected.value?.id_usuario === id) selected.value = res.employee
      return res.employee
    } catch (e) {
      error.value = extractErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  function clearError(): void { error.value = null }
  function clearSelected(): void { selected.value = null }

  return {
    employees, selected, loading, error,
    fetchAll, fetchOne, create, update, clearError, clearSelected,
  }
})
