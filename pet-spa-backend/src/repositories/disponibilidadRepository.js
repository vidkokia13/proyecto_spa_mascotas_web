'use strict';

const db = require('../config/db');

async function findByTrabajador(idTrabajador, client = db) {
  const { rows } = await client.query(
    'SELECT * FROM disponibilidad_groomers WHERE id_trabajador = $1 AND activo = true ORDER BY dia_semana',
    [idTrabajador],
  );
  return rows;
}

async function upsert({ idTrabajador, diaSemana, horaInicio, horaFin }, client = db) {
  const { rows } = await client.query(
    `INSERT INTO disponibilidad_groomers (id_trabajador, dia_semana, hora_inicio, hora_fin)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (id_trabajador, dia_semana) DO UPDATE
       SET hora_inicio = EXCLUDED.hora_inicio,
           hora_fin    = EXCLUDED.hora_fin,
           activo      = true
     RETURNING *`,
    [idTrabajador, diaSemana, horaInicio, horaFin],
  );
  return rows[0];
}

async function remove(idTrabajador, diaSemana, client = db) {
  await client.query(
    'UPDATE disponibilidad_groomers SET activo = false WHERE id_trabajador = $1 AND dia_semana = $2',
    [idTrabajador, diaSemana],
  );
}

async function findAvailableOnDay(diaSemana, fechaInicio, fechaFin, client = db) {
  // Returns groomers available on a given weekday that have no blockout in the range
  const { rows } = await client.query(
    `SELECT dg.*, t.id_trabajador, u.nombre AS nombre_trabajador
     FROM disponibilidad_groomers dg
     JOIN trabajadores t ON dg.id_trabajador = t.id_trabajador
     JOIN usuarios u ON t.id_usuario = u.id_usuario
     WHERE dg.dia_semana = $1
       AND dg.activo = true
       AND u.estado = 'activo'
       AND NOT EXISTS (
         SELECT 1 FROM bloqueos b
         WHERE b.id_trabajador = dg.id_trabajador
           AND b.fecha_inicio < $3
           AND b.fecha_fin    > $2
       )
     ORDER BY u.nombre`,
    [diaSemana, fechaInicio, fechaFin],
  );
  return rows;
}

module.exports = { findByTrabajador, upsert, remove, findAvailableOnDay };
