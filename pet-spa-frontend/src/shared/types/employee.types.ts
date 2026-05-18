export interface Employee {
  id_usuario: string
  id_trabajador: string
  nombre: string
  email: string
  rol: string
  estado: string
  turno: string | null
  especialidad: string | null
  activo: boolean
  telefono: string | null
  sueldo_mensual: number | null
  capacidad_simultanea: number
}

export interface CreateEmployeePayload {
  nombre: string
  email: string
  password: string
  rol: 'trabajador' | 'admin' | 'jefe'
  sueldoMensual?: number | null
  activo?: boolean
  turno?: string | null
  telefono?: string | null
  especialidad?: string | null
  capacidadSimultanea?: number
}

export interface UpdateEmployeePayload {
  estado?: 'activo' | 'inactivo'
  turno?: string | null
  especialidad?: string | null
  activo?: boolean
  telefono?: string | null
  sueldoMensual?: number | null
  capacidadSimultanea?: number
}

export interface EmployeeListResponse {
  employees: Employee[]
}

export interface EmployeeResponse {
  employee: Employee
}
