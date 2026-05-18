import type { CreateEmployeePayload, UpdateEmployeePayload, EmployeeListResponse, EmployeeResponse } from '@/shared/types/employee.types'

export interface IEmployeeRepository {
  list(): Promise<EmployeeListResponse>
  getOne(id: string): Promise<EmployeeResponse>
  create(payload: CreateEmployeePayload): Promise<EmployeeResponse>
  update(id: string, payload: UpdateEmployeePayload): Promise<EmployeeResponse>
}
