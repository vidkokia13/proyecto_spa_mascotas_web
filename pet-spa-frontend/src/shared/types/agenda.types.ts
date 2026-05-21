// ── Mascotas ────────────────────────────────────────────────────────────────
export interface Mascota {
  id_mascota:      string
  id_cliente:      string
  nombre:          string
  especie:         string
  raza:            string | null
  tamano:          'pequeno' | 'mediano' | 'grande' | 'gigante'
  temperamento:    'tranquilo' | 'nervioso' | 'agresivo'
  tiempo_extra_min: number
  peso_kg:         number | null
  notas:           string | null
  activo:          boolean
  creado_en:       string
}

export interface CreateMascotaPayload {
  nombre:          string
  especie?:        string
  raza?:           string | null
  tamano?:         Mascota['tamano']
  temperamento?:   Mascota['temperamento']
  tiempoExtraMin?: number
  pesoKg?:         number | null
  notas?:          string | null
}

export interface UpdateMascotaPayload extends Partial<CreateMascotaPayload> {}

export interface MascotaListResponse { mascotas: Mascota[] }
export interface MascotaResponse     { mascota:  Mascota }

// ── Servicios ────────────────────────────────────────────────────────────────
export interface Servicio {
  id_servicio:  string
  nombre:       string
  descripcion:  string | null
  duracion_base: number
  precio_base:  number
  categoria:    string | null
  activo:       boolean
  creado_en:    string
}

export interface CreateServicioPayload {
  nombre:       string
  descripcion?: string | null
  duracionBase: number
  precioBase?:  number
  categoria?:   string | null
}

export interface UpdateServicioPayload extends Partial<CreateServicioPayload> {
  activo?: boolean
}

export interface ServicioListResponse { servicios: Servicio[] }
export interface ServicioResponse     { servicio:  Servicio }

// ── Horarios ─────────────────────────────────────────────────────────────────
export interface Horario {
  id_horario:   string
  dia_semana:   number
  hora_inicio:  string
  hora_fin:     string
  capacidad_max: number
  activo:       boolean
}

export interface SetHorarioPayload {
  diaSemana:    number
  horaInicio:   string
  horaFin:      string
  capacidadMax?: number
}

export interface HorarioListResponse { horarios: Horario[] }
export interface HorarioResponse     { horario:  Horario }

// ── Disponibilidad Groomers ───────────────────────────────────────────────────
export interface Disponibilidad {
  id_disponibilidad: string
  id_trabajador:     string
  dia_semana:        number
  hora_inicio:       string
  hora_fin:          string
  activo:            boolean
}

export interface SetDisponibilidadPayload {
  idTrabajador: string
  diaSemana:    number
  horaInicio:   string
  horaFin:      string
}

// ── Bloqueos ──────────────────────────────────────────────────────────────────
export interface Bloqueo {
  id_bloqueo:    string
  tipo:          string
  fecha_inicio:  string
  fecha_fin:     string
  motivo:        string | null
  id_trabajador: string | null
  creado_por:    string | null
  creado_en:     string
}

export interface CreateBloqueoPayload {
  tipo?:         string
  fechaInicio:   string
  fechaFin:      string
  motivo?:       string | null
  idTrabajador?: string | null
}

export interface BloqueoListResponse { bloqueos: Bloqueo[] }
export interface BloqueoResponse     { bloqueo:  Bloqueo }

// ── Slots ─────────────────────────────────────────────────────────────────────
export interface Slot {
  hora:            string
  hora_fin:        string
  duracion_minutos: number
}

export interface SlotsResponse {
  fecha:           string
  dia_semana:      number
  duracion_ajustada: number
  slots:           Slot[]
}

// ── Citas ─────────────────────────────────────────────────────────────────────
export type EstadoCita = 'pendiente' | 'confirmada' | 'en_proceso' | 'completada' | 'cancelada'

export interface Cita {
  id_cita:           string
  id_cliente:        string
  id_mascota:        string
  id_servicio:       string
  id_trabajador:     string | null
  fecha_hora_inicio: string
  fecha_hora_fin:    string
  duracion_ajustada: number
  estado:            EstadoCita
  notas:             string | null
  creado_por:        string | null
  creado_en:         string
  // joined
  nombre_mascota:    string
  tamano:            string
  temperamento:      string
  nombre_servicio:   string
  precio_base:       number
  nombre_cliente:    string
  email_cliente:     string
  id_usuario_cliente: string
  nombre_trabajador: string | null
}

export interface CreateCitaPayload {
  idMascota:        string
  idServicio:       string
  idTrabajador?:    string | null
  fechaHoraInicio:  string
  notas?:           string | null
  idUsuarioCliente?: string
}

export interface UpdateCitaPayload {
  id_trabajador?:    string | null
  fecha_hora_inicio?: string
  fecha_hora_fin?:   string
  notas?:            string | null
}

export interface CambiarEstadoPayload { estado: EstadoCita }

export interface CitaListResponse { citas: Cita[] }
export interface CitaResponse     { cita:  Cita }
