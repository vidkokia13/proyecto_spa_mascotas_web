export interface EmployeeEntity {
  id_usuario:           string
  id_trabajador:        string
  nombre:               string
  email:                string
  rol:                  string
  estado:               string
  turno:                string | null
  especialidad:         string | null
  activo:               boolean
  telefono:             string | null
  sueldo_mensual:       number | null
  capacidad_simultanea: number
}
