export interface AuditLogEntity {
  id_log:          string
  id_usuario:      string | null
  nombre_usuario:  string | null
  email_usuario:   string | null
  accion:          string
  detalle:         string | null
  ip_address:      string | null
  user_agent:      string | null
  fecha:           string
}
