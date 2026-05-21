'use strict';

const db = require('../config/db');

async function create({ tipo = 'otro', fechaInicio, fechaFin, motivo = null, idTrabajador = null, creadoPor = null }, client = db) {
  const { rows } = await client.query(
    `INSERT INTO bloqueos (tipo, fecha_inicio, fecha_fin, motivo, id_trabajador, creado_por)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [tipo, fechaInicio, fechaFin, motivo, idTrabajador, creadoPor],
  );
  return rows[0];
}

async function findById(idBloqueo, client = db) {
  const { rows } = await client.query(
    'SELECT * FROM bloqueos WHERE id_bloqueo = $1',
    [idBloqueo],
  );
  return rows[0] || null;
}

async function findInRange(fechaInicio, fechaFin, idTrabajador = null, client = db) {
  const params = [fechaInicio, fechaFin];
  let where = 'fecha_inicio < $2 AND fecha_fin > $1';
  if (idTrabajador !== null) {
    params.push(idTrabajador);
    where += ` AND (id_trabajador = $3 OR id_trabajador IS NULL)`;
  } else {
    where += ' AND id_trabajador IS NULL';
  }
  const { rows } = await client.query(
    `SELECT b.*, u.nombre AS creado_por_nombre
     FROM bloqueos b
     LEFT JOIN usuarios u ON b.creado_por = u.id_usuario
     WHERE ${where}
     ORDER BY fecha_inicio`,
    params,
  );
  return rows;
}

async function remove(idBloqueo, client = db) {
  await client.query('DELETE FROM bloqueos WHERE id_bloqueo = $1', [idBloqueo]);
}

module.exports = { create, findById, findInRange, remove };
