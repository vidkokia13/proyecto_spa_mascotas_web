// ── Mascotas ────────────────────────────────────────────────────────────────
export type Temperamento = 'tranquilo' | 'nervioso' | 'agresivo' | 'inquieto'
export type TamanoMascota = 'pequeno' | 'mediano' | 'grande' | 'gigante'

export interface Mascota {
  id_mascota:         string
  id_cliente:         string
  nombre:             string
  especie:            string
  raza:               string | null
  tamano:             TamanoMascota
  temperamento:       Temperamento
  fecha_nacimiento:   string | null
  alergias:           string | null
  carnet_vacunas_url: string | null
  tiempo_extra_min:   number
  peso_kg:            number | null
  notas:              string | null
  activo:             boolean
  creado_en:          string
}


export interface CreateMascotaPayload {
  nombre:           string
  especie?:         string
  raza?:            string | null
  tamano?:          TamanoMascota
  temperamento?:    Temperamento
  fechaNacimiento?: string | null
  alergias?:        string | null
  tiempoExtraMin?:  number
  pesoKg?:          number | null
  notas?:           string | null
}

export interface UpdateMascotaPayload extends Partial<CreateMascotaPayload> {}

export interface MascotaListResponse { mascotas: Mascota[] }
export interface MascotaResponse     { mascota:  Mascota }

export interface CancelarCitaPayload {
  motivo:         'salud' | 'tiempo' | 'emergencia' | 'otro'
  detalle?:       string | null
  aceptaPolitica: true
}

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

// ── Groomers ──────────────────────────────────────────────────────────────────
export interface Groomer {
  id_trabajador: string
  nombre:        string
  especialidad:  string | null
}
export interface GroomersResponse { groomers: Groomer[] }

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
export interface ReprogramarPayload   { fechaHoraInicio: string }

export interface CitaListResponse { citas: Cita[] }
export interface CitaResponse     { cita:  Cita }

// ── Pagos ─────────────────────────────────────────────────────────────────────
export type MetodoPago = 'efectivo' | 'qr' | 'transferencia'

export interface Pago {
  id_pago:        string
  id_cita:        string
  monto:          number
  metodo:         MetodoPago
  referencia:     string | null
  registrado_por: string | null
  creado_en:      string
}
export interface CreatePagoPayload {
  idCita:           string
  monto:            number
  metodo:           MetodoPago
  referencia?:      string | null
  idPromocion?:     string | null
  codigoPromocion?: string | null
}
export interface PagoListResponse { pagos: Pago[] }
export interface PagoResponse     { pago:  Pago  }

export interface Recibo {
  id_cita:           string
  nombre_cliente:    string
  nombre_mascota:    string
  nombre_servicio:   string
  fecha_hora_inicio: string
  estado:            string
  total_pagado:      number
  total_descuentos:  number
  pagos:             Pago[]
  emitido_en:        string
}
export interface ReciboResponse { recibo: Recibo }

// ── Fichas técnicas ───────────────────────────────────────────────────────────
export interface FichaTecnica {
  id_ficha:       string
  id_cita:        string
  estado_pelaje:  string | null
  condicion_piel: string | null
  observaciones:  string | null
  peso_actual:    number | null
  estado_ingreso: string | null
  recomendaciones: string | null
  creado_por:     string | null
  creado_en:      string
  actualizado_en: string
}
export interface UpsertFichaPayload {
  idCita:          string
  estadoPelaje?:   string | null
  condicionPiel?:  string | null
  observaciones?:  string | null
  pesoActual?:     number | null
  estadoIngreso?:  string | null
  recomendaciones?: string | null
}
export interface FichaResponse { ficha: FichaTecnica }

// ── Checklist ─────────────────────────────────────────────────────────────────
export interface ChecklistItem {
  id_item:     string
  id_servicio: string | null
  descripcion: string
  orden:       number
  activo:      boolean
}
export interface CitaChecklistEntry {
  id_item:       string
  descripcion:   string
  orden:         number
  completado:    boolean
  completado_en: string | null
}
export interface ChecklistItemsResponse  { items:     ChecklistItem[]      }
export interface CitaChecklistResponse   { checklist: CitaChecklistEntry[] }
export interface CreateChecklistItemPayload {
  descripcion:  string
  orden?:       number
  idServicio?:  string | null
}
export interface UpdateChecklistItemPayload {
  descripcion?: string
  orden?:       number
  activo?:      boolean
}

// ── Fotos ─────────────────────────────────────────────────────────────────────
export type TipoFoto = 'antes' | 'durante' | 'despues'

export interface Foto {
  id_foto:    string
  id_cita:    string
  tipo:       TipoFoto
  url:        string
  subido_por: string | null
  creado_en:  string
}
export interface FotoListResponse { fotos: Foto[] }
export interface FotoResponse     { foto:  Foto  }

// ── Insumos ───────────────────────────────────────────────────────────────────
export interface Insumo {
  id_insumo:    string
  nombre:       string
  unidad:       string
  stock:        number
  stock_minimo: number
  activo:       boolean
  creado_en:    string
}
export interface CitaInsumo {
  id_cita_insumo:    string
  id_cita:           string
  id_insumo:         string
  nombre_insumo:     string
  unidad:            string
  cantidad_recibida: number
  cantidad_usada:    number
  cantidad_devuelta: number
  desperdicio:       number
  registrado_por:    string | null
  creado_en:         string
}
export interface InsumoListResponse    { insumos: Insumo[]    }
export interface CitaInsumoListResponse{ insumos: CitaInsumo[] }

export interface CreateInsumoPayload {
  nombre:       string
  unidad:       string
  stock?:       number
  stockMinimo?: number
}
export interface UpdateInsumoPayload extends Partial<CreateInsumoPayload> {
  stock_minimo?: number
  activo?:       boolean
}
export interface AlertasInsumoResponse { insumos: Insumo[]; total: number }
export interface InsumoLog {
  id_cita_insumo:    string
  id_cita:           string
  id_insumo:         string
  cantidad_recibida: number
  cantidad_usada:    number
  cantidad_devuelta: number
  desperdicio:       number
  creado_en:         string
  nombre_insumo:     string
  unidad:            string
  id_trabajador:     string | null
  nombre_groomer:    string | null
}
export interface InsumoLogResponse { registros: InsumoLog[]; total: number }
export interface InsumoAlerta { tipo: 'stock_critico' | 'consumo_elevado'; mensaje: string }
export interface InsumoPrediccion {
  id_insumo:           string
  nombre:              string
  unidad:              string
  stock:               number
  stock_minimo:        number
  num_servicios:       number
  promedio_uso:        number
  servicios_restantes: number | null
  pct_desperdicio:     number
  alertas:             InsumoAlerta[]
}
export interface InsumoPrediccionResponse {
  items:         InsumoPrediccion[]
  alertas:       InsumoPrediccion[]
  total_alertas: number
}
export interface RegisterInsumosItemPayload {
  idInsumo:          string
  cantidadRecibida:  number
  cantidadUsada:     number
  cantidadDevuelta?: number
  desperdicio?:      number
}
export interface RegisterInsumosPayload {
  idCita:   string
  insumos:  RegisterInsumosItemPayload[]
}
export interface UpdateCitaInsumoPayload {
  cantidadUsada?:    number
  cantidadDevuelta?: number
  desperdicio?:      number
}

// ── Promociones ───────────────────────────────────────────────────────────────
export type TipoPromocion = 'porcentaje' | 'monto_fijo'

export interface Promocion {
  id_promocion:  string
  nombre:        string
  descripcion:   string | null
  tipo:          TipoPromocion
  valor:         number
  codigo:        string | null
  fecha_inicio:  string
  fecha_fin:     string
  activo:        boolean
  creado_por:    string | null
  creado_en:     string
}
export interface CreatePromocionPayload {
  nombre:        string
  descripcion?:  string | null
  tipo:          TipoPromocion
  valor:         number
  codigo?:       string | null
  fechaInicio:   string
  fechaFin:      string
}
export interface UpdatePromocionPayload extends Partial<CreatePromocionPayload> {
  activo?: boolean
}
export interface VerificarPromocionPayload {
  codigo:     string
  montoBase:  number
}
export interface VerificarPromocionResponse {
  promocion:   Promocion
  montoBase:   number
  descuento:   number
  montoFinal:  number
}
export interface PromocionListResponse { promociones: Promocion[] }
export interface PromocionResponse     { promocion:   Promocion }

// ── Productos ─────────────────────────────────────────────────────────────────
export type CategoriaProducto = 'alimento' | 'accesorio' | 'higiene' | 'juguete' | 'salud' | 'otro'

export interface Producto {
  id_producto:       string
  nombre:            string
  descripcion:       string | null
  categoria:         CategoriaProducto
  precio:            number
  stock:             number
  stock_minimo:      number
  imagen_url:        string | null
  imagen_public_id:  string | null
  activo:            boolean
  creado_en:         string
}
export interface CreateProductoPayload {
  nombre:      string
  descripcion?: string | null
  categoria?:  CategoriaProducto
  precio:      number
  stock?:      number
  stockMinimo?: number
}
export interface UpdateProductoPayload extends Partial<CreateProductoPayload> {
  activo?: boolean
}
export interface ProductoListResponse { productos: Producto[] }
export interface ProductoResponse     { producto:  Producto }

// ── Pedidos ───────────────────────────────────────────────────────────────────
export type EstadoPedido = 'borrador' | 'enviado' | 'completado' | 'cancelado'

export interface PedidoItem {
  id_item:        string
  id_pedido:      string
  id_producto:    string
  nombre:         string
  imagen_url:     string | null
  cantidad:       number
  precio_unitario: number
  subtotal:       number
}
export type MetodoPago = 'efectivo' | 'qr' | 'transferencia'

export interface Pedido {
  id_pedido:       string
  id_usuario:      string
  estado:          EstadoPedido
  notas:           string | null
  total:           number
  metodo_pago?:    MetodoPago | null
  referencia_pago?: string | null
  creado_en:       string
  actualizado_en:  string
  cliente_nombre?: string
  cliente_email?:  string
}
export interface CreatePedidoItem {
  idProducto: string
  cantidad:   number
}
export interface CreatePedidoPayload {
  items:                   CreatePedidoItem[]
  notas?:                  string | null
  metodoPago?:             MetodoPago | null
  referenciaPago?:         string | null
  completarInmediatamente?: boolean
}
export interface PedidoListResponse { pedidos: Pedido[] }
export interface PedidoDetalleResponse { pedido: Pedido; items: PedidoItem[] }

// ── Notificaciones ────────────────────────────────────────────────────────────
export type TipoNotificacion =
  | 'recordatorio_24h'
  | 'recordatorio_2h'
  | 'bajo_stock'

export interface NotificacionEnviada {
  id:            number
  tipo:          TipoNotificacion
  referencia_id: string
  enviado_a:     string | null
  enviado_en:    string
}

export interface NotifStatItem {
  tipo:  TipoNotificacion
  total: number
}

export interface NotifListResponse {
  notificaciones: NotificacionEnviada[]
  total:          number
  limit:          number
  offset:         number
}

export interface NotifStatsResponse {
  fecha:    string
  hoy:      NotifStatItem[]
  historico: NotifStatItem[]
}

// ── Caja ──────────────────────────────────────────────────────────────────────
export interface ResumenMetodo {
  metodo:           string
  total:            number
  total_descuentos: number
  cantidad:         number
}
export interface ResumenPago {
  id_pago:        string
  id_cita:        string
  monto:          number
  descuento:      number
  metodo:         string
  referencia:     string | null
  nombre_cliente: string
  nombre_mascota: string
  nombre_servicio: string
  creado_en:      string
}
export interface ResumenCaja {
  fecha:             string
  ya_cerrada:        boolean
  total_general:     number
  total_descuentos:  number
  num_pagos:         number
  num_citas:         number
  por_metodo:        ResumenMetodo[]
  pagos:             ResumenPago[]
  cierre?:           CierreCaja | null
}
export interface CierreCaja {
  id_cierre:           string
  fecha:               string
  total_efectivo:      number
  total_qr:            number
  total_transferencia: number
  total_general:       number
  total_descuentos:    number
  num_pagos:           number
  num_citas:           number
  cerrado_por:         string | null
  cerrado_en:          string
  notas:               string | null
}
export interface ResumenCajaResponse    { resumen:  ResumenCaja  }
export interface CierreCajaResponse     { cierre:   CierreCaja   }
export interface HistorialCierresResponse { cierres: CierreCaja[] }
