'use strict';

const db = require('../config/db');

// Citas confirmadas/pendientes en la ventana de 24 h (±30 min)
async function citasPendientes24h(client = db) {
  const { rows } = await client.query(`
    SELECT c.id_cita, c.fecha_hora_inicio,
           u.email   AS email_cliente,
           u.nombre  AS nombre_cliente,
           m.nombre  AS nombre_mascota,
           s.nombre  AS nombre_servicio
    FROM   citas c
    JOIN   clientes  cl ON c.id_cliente  = cl.id_cliente
    JOIN   usuarios  u  ON cl.id_usuario = u.id_usuario
    JOIN   mascotas  m  ON c.id_mascota  = m.id_mascota
    JOIN   servicios s  ON c.id_servicio = s.id_servicio
    WHERE  c.estado IN ('confirmada', 'pendiente')
      AND  c.fecha_hora_inicio
             BETWEEN NOW() + INTERVAL '23 hours 30 minutes'
                 AND NOW() + INTERVAL '24 hours 30 minutes'
  `);
  return rows;
}

// Citas confirmadas/pendientes en la ventana de 2 h (±15 min)
async function citasPendientes2h(client = db) {
  const { rows } = await client.query(`
    SELECT c.id_cita, c.fecha_hora_inicio,
           u.email   AS email_cliente,
           u.nombre  AS nombre_cliente,
           m.nombre  AS nombre_mascota,
           s.nombre  AS nombre_servicio
    FROM   citas c
    JOIN   clientes  cl ON c.id_cliente  = cl.id_cliente
    JOIN   usuarios  u  ON cl.id_usuario = u.id_usuario
    JOIN   mascotas  m  ON c.id_mascota  = m.id_mascota
    JOIN   servicios s  ON c.id_servicio = s.id_servicio
    WHERE  c.estado IN ('confirmada', 'pendiente')
      AND  c.fecha_hora_inicio
             BETWEEN NOW() + INTERVAL '1 hour 45 minutes'
                 AND NOW() + INTERVAL '2 hours 15 minutes'
  `);
  return rows;
}

// ¿Ya se envió este recordatorio para esta cita?
async function yaEnviadaRecordatorio(tipo, idCita, client = db) {
  const { rows } = await client.query(
    `SELECT 1 FROM notificaciones_enviadas WHERE tipo = $1 AND referencia_id = $2 LIMIT 1`,
    [tipo, idCita],
  );
  return rows.length > 0;
}

// Registrar notificación enviada (ON CONFLICT DO NOTHING para recordatorios con índice único)
async function marcarEnviada(tipo, referenciaId, enviadoA, client = db) {
  await client.query(
    `INSERT INTO notificaciones_enviadas (tipo, referencia_id, enviado_a)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [tipo, referenciaId, enviadoA],
  );
}

// ¿Se envió una notificación de bajo stock en las últimas 24 h para este producto?
async function bajoStockReciente(idProducto, client = db) {
  const { rows } = await client.query(
    `SELECT 1 FROM notificaciones_enviadas
     WHERE tipo = 'bajo_stock'
       AND referencia_id = $1
       AND enviado_en > NOW() - INTERVAL '24 hours'
     LIMIT 1`,
    [String(idProducto)],
  );
  return rows.length > 0;
}

// Emails de admin/jefe activos para notificaciones internas
async function getAdminEmails(client = db) {
  const { rows } = await client.query(
    `SELECT u.email, u.nombre
     FROM   usuarios u
     WHERE  u.rol IN ('admin', 'jefe') AND u.activo = true`,
  );
  return rows;
}

// ── Panel de administración ───────────────────────────────────────────────────

async function findAll({ tipo, fecha, limit = 50, offset = 0 } = {}, client = db) {
  const conditions = [];
  const values     = [];
  let i = 1;
  if (tipo)  { conditions.push(`tipo = $${i++}`);             values.push(tipo); }
  if (fecha) { conditions.push(`DATE(enviado_en AT TIME ZONE 'UTC') = $${i++}`); values.push(fecha); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await client.query(
    `SELECT * FROM notificaciones_enviadas
     ${where}
     ORDER BY enviado_en DESC
     LIMIT $${i++} OFFSET $${i++}`,
    [...values, Number(limit), Number(offset)],
  );
  return rows;
}

async function countAll({ tipo, fecha } = {}, client = db) {
  const conditions = [];
  const values     = [];
  let i = 1;
  if (tipo)  { conditions.push(`tipo = $${i++}`);             values.push(tipo); }
  if (fecha) { conditions.push(`DATE(enviado_en AT TIME ZONE 'UTC') = $${i++}`); values.push(fecha); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS total FROM notificaciones_enviadas ${where}`,
    values,
  );
  return rows[0]?.total ?? 0;
}

async function statsPorTipo(fecha, client = db) {
  // Si no hay fecha, devuelve totales históricos por tipo
  if (!fecha) {
    const { rows } = await client.query(
      `SELECT tipo, COUNT(*)::int AS total FROM notificaciones_enviadas GROUP BY tipo`,
    );
    return rows;
  }
  const { rows } = await client.query(
    `SELECT tipo, COUNT(*)::int AS total
     FROM notificaciones_enviadas
     WHERE DATE(enviado_en AT TIME ZONE 'UTC') = $1
     GROUP BY tipo`,
    [fecha],
  );
  return rows;
}

async function totalHistorico(client = db) {
  const { rows } = await client.query(
    `SELECT tipo, COUNT(*)::int AS total
     FROM notificaciones_enviadas
     GROUP BY tipo`,
  );
  return rows;
}

module.exports = {
  citasPendientes24h,
  citasPendientes2h,
  yaEnviadaRecordatorio,
  marcarEnviada,
  bajoStockReciente,
  getAdminEmails,
  // panel admin
  findAll,
  countAll,
  statsPorTipo,
  totalHistorico,
};
