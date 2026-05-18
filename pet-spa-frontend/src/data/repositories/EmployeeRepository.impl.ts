import { employeeDatasource } from '@/data/datasources/EmployeeDatasource'
import type { IEmployeeRepository } from '@/domain/repositories/EmployeeRepository.interface'
import type { CreateEmployeePayload, UpdateEmployeePayload, EmployeeListResponse, EmployeeResponse } from '@/shared/types/employee.types'

export class EmployeeRepositoryImpl implements IEmployeeRepository {
  list(): Promise<EmployeeListResponse> {
    return employeeDatasource.list()
  }

  getOne(id: string): Promise<EmployeeResponse> {
    return employeeDatasource.getOne(id)
  }

  create(payload: CreateEmployeePayload): Promise<EmployeeResponse> {
    return employeeDatasource.create(payload)
  }

  update(id: string, payload: UpdateEmployeePayload): Promise<EmployeeResponse> {
    return employeeDatasource.update(id, payload)
  }
}

export const employeeRepository = new EmployeeRepositoryImpl()
