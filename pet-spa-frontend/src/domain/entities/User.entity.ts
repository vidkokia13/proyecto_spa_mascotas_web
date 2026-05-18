import type { Role } from '@/shared/constants/roles'

export interface UserEntity {
  id_usuario:         string
  id_rol:             number
  rol:                Role
  nombre:             string
  email:              string
  estado:             string
  two_factor_enabled: boolean
  ultimo_acceso:      string | null
  id_cliente:         string | null
  id_trabajador:      string | null
}
