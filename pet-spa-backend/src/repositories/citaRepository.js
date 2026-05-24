'use strict';

// Actual DB schema:
//   citas(id_cita, id_cliente→clientes, id_mascota, id_servicio, fecha_cita,
//         estado_empleado, estado_cliente, estado_global, motivo_cancelacion,
//         cancelado_por, terminado_por_empleado, confirmado_por_cliente,
//         fecha_creacion, fecha_ultima_actualizacion,
//         [+nuevos] id_trabajador, fecha_hora_inicio, fecha_hora_fin,
//                   duracion_ajustada, estado, notas, creado_por, creado_en)
//
// We use id_cliente (from clientes table) and the new "estado" column for module 2.

const db = require('../config/db');

const BASE_SELECT = `
  SELECT
    c.*,
    m.nombre         AS nombre_mascota,
    m.tamano,
    m.temperamento,
    s.nombre         AS nombre_servicio,
    s.precio         AS precio_base,
    u.nombre         AS nombre_cliente,
    u.email          AS email_cliente,
    cl.id_usuario    AS id_usuario_cliente,
    t_u.nombre       AS nombre_trabajador
  FROM citas c
  JOIN mascotas     m   ON c.id_mascota  = m.id_mascota
  JOIN servicios    s   ON c.id_servicio = s.id_servicio
  JOIN clientes     cl  ON c.id_cliente  = cl.id_cliente
  JOIN usuarios     u   ON cl.id_usuario = u.id_usuario
  LEFT JOIN trabajadores t   ON c.id_trabajador = t.id_trabajador
  LEFT JOIN usuarios   t_u   ON t.id_usuario    = t_u.id_usuario
`;

async function create({ idCliente, idMascota, idServicio, idTrabajador = null,
  fechaHoraInicio, fechaHoraFin, duracionAjustada, notas = null, creadoPor = null }, client = db) {
  const { rows } = await client.query(
    `INSERT INTO citas
       (id_cliente, id_mascota, id_servicio, id_trabajador,
        fecha_cita, fecha_hora_inicio, fecha_hora_fin, duracion_ajustada, notas, creado_por)
     VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8,$9)
     RETURNING *`,
    [idCliente, idMascota, idServicio, idTrabajador,
      fechaHoraInicio, fechaHoraFin, duracionAjustada, notas, creadoPor],
  );
  return rows[0];
}

async function findById(idCita, client = db) {
  const { rows } = await client.query(`${BASE_SELECT} WHERE c.id_cita = $1`, [idCita]);
  return rows[0] || null;
}

async function findByCliente(idUsuario, { limit = 20, offset = 0 } = {}, client = db) {
  const { rows } = await client.query(
    `${BASE_SELECT}
     WHERE cl.id_usuario = $1
     ORDER BY c.fecha_hora_inicio DESC NULLS LAST, c.fecha_cita DESC
     LIMIT $2 OFFSET $3`,
    [idUsuario, limit, offset],
  );
  return rows;
}

async function findInRange(fechaInicio, fechaFin, { idTrabajador = null, estado = null } = {}, client = db) {
  const params = [fechaInicio, fechaFin];
  const conditions = ['c.fecha_hora_inicio >= $1', 'c.fecha_hora_inicio < $2'];
  if (idTrabajador) { params.push(idTrabajador); conditions.push(`c.id_trabajador = $${params.length}`); }
  if (estado)       { params.push(estado);       conditions.push(`c.estado = $${params.length}`);       }
  const { rows } = await client.query(
    `${BASE_SELECT} WHERE ${conditions.join(' AND ')} ORDER BY c.fecha_hora_inicio`,
    params,
  );
  return rows;
}

async function countOverlaps(idTrabajador, fechaHoraInicio, fechaHoraFin, excludeId = null, client = db) {
  const params = [idTrabajador, fechaHoraInicio, fechaHoraFin];
  let extra = '';
  if (excludeId) { params.push(excludeId); extra = ` AND id_cita <> $${params.length}`; }
  const { rows } = await client.query(
    `SELECT COUNT(*) AS total FROM citas
     WHERE id_trabajador = $1
       AND estado <> 'cancelada'
       AND fecha_hora_inicio < $3
       AND fecha_hora_fin    > $2
       ${extra}`,
    params,
  );
  return parseInt(rows[0].total, 10);
}

async function countSpaOverlaps(fechaHoraInicio, fechaHoraFin, excludeId = null, client = db) {
  const params = [fechaHoraInicio, fechaHoraFin];
  let extra = '';
  if (excludeId) { params.push(excludeId); extra = ` AND id_cita <> $${params.length}`; }
  const { rows } = await client.query(
    `SELECT COUNT(*) AS total FROM citas
     WHERE estado <> 'cancelada'
       AND fecha_hora_inicio < $2
       AND fecha_hora_fin    > $1
       ${extra}`,
    params,
  );
  return parseInt(rows[0].total, 10);
}

async function updateEstado(idCita, estado, client = db) {
  const { rows } = await client.query(
    'UPDATE citas SET estado = $1 WHERE id_cita = $2 RETURNING *',
    [estado, idCita],
  );
  return rows[0] || null;
}

async function update(idCita, fields, client = db) {
  const colMap = {
    id_trabajador:      'id_trabajador',
    fecha_hora_inicio:  'fecha_hora_inicio',
    fecha_hora_fin:     'fecha_hora_fin',
    duracion_ajustada:  'duracion_ajustada',
    estado:             'estado',
    notas:              'notas',
    motivo_cancelacion: 'motivo_cancelacion',
  };
  const setClauses = [];
  const values = [];
  let i = 1;
  for (const [key, val] of Object.entries(fields)) {
    const col = colMap[key];
    if (col) { setClauses.push(`${col} = $${i++}`); values.push(val); }
  }
  if (setClauses.length === 0) return null;
  values.push(idCita);
  const { rows } = await client.query(
    `UPDATE citas SET ${setClauses.join(', ')} WHERE id_cita = $${i} RETURNING *`,
    values,
  );
  return rows[0] || null;
}

async function findCalendario(fechaInicio, fechaFin, client = db) {
  const { rows } = await client.query(
    `${BASE_SELECT}
     WHERE c.fecha_hora_inicio >= $1
       AND c.fecha_hora_inicio <  $2
       AND c.estado <> 'cancelada'
     ORDER BY t.id_trabajador NULLS LAST, c.fecha_hora_inicio`,
    [fechaInicio, fechaFin],
  );
  return rows;
}

module.exports = { create, findById, findByCliente, findInRange, countOverlaps, countSpaOverlaps, updateEstado, update, findCalendario };
