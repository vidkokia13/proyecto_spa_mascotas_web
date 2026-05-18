import http from '@/infrastructure/api/axios.instance'
import { API_ENDPOINTS } from '@/core/config/api.config'
import type { CreateEmployeePayload, UpdateEmployeePayload, EmployeeListResponse, EmployeeResponse } from '@/shared/types/employee.types'

export const employeeDatasource = {
  async list(): Promise<EmployeeListResponse> {
    const { data } = await http.get<EmployeeListResponse>(API_ENDPOINTS.EMPLOYEES.BASE)
    return data
  },

  async getOne(id: string): Promise<EmployeeResponse> {
    const { data } = await http.get<EmployeeResponse>(API_ENDPOINTS.EMPLOYEES.BY_ID(id))
    return data
  },

  async create(payload: CreateEmployeePayload): Promise<EmployeeResponse> {
    const { data } = await http.post<EmployeeResponse>(API_ENDPOINTS.EMPLOYEES.BASE, payload)
    return data
  },

  async update(id: string, payload: UpdateEmployeePayload): Promise<EmployeeResponse> {
    const { data } = await http.patch<EmployeeResponse>(API_ENDPOINTS.EMPLOYEES.BY_ID(id), payload)
    return data
  },
}
