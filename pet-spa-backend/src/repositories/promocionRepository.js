'use strict';

const db = require('../config/db');

async function findAll({ soloActivas = false } = {}, client = db) {
  const where = soloActivas ? "WHERE activo = true AND fecha_fin >= CURRENT_DATE" : '';
  const { rows } = await client.query(
    `SELECT p.*, u.nombre AS nombre_creado_por
     FROM promociones p
     LEFT JOIN usuarios u ON p.creado_por = u.id_usuario
     ${where}
     ORDER BY p.fecha_inicio DESC`,
  );
  return rows;
}

async function findById(idPromocion, client = db) {
  const { rows } = await client.query(
    'SELECT * FROM promociones WHERE id_promocion = $1',
    [idPromocion],
  );
  return rows[0] || null;
}

async function findByCodigo(codigo, client = db) {
  const { rows } = await client.query(
    `SELECT * FROM promociones
     WHERE codigo = $1 AND activo = true
       AND fecha_inicio <= CURRENT_DATE AND fecha_fin >= CURRENT_DATE`,
    [codigo],
  );
  return rows[0] || null;
}

async function create({ nombre, descripcion = null, tipo, valor, codigo = null,
  fechaInicio, fechaFin, creadoPor = null }, client = db) {
  const { rows } = await client.query(
    `INSERT INTO promociones (nombre, descripcion, tipo, valor, codigo, fecha_inicio, fecha_fin, creado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [nombre, descripcion, tipo, valor, codigo || null, fechaInicio, fechaFin, creadoPor],
  );
  return rows[0];
}

async function update(idPromocion, fields, client = db) {
  const allowed = ['nombre','descripcion','tipo','valor','codigo','fecha_inicio','fecha_fin','activo'];
  const colMap  = { fechaInicio: 'fecha_inicio', fechaFin: 'fecha_fin' };
  const setClauses = [];
  const values = [];
  let i = 1;
  for (const [key, val] of Object.entries(fields)) {
    const col = colMap[key] || (allowed.includes(key) ? key : null);
    if (col) { setClauses.push(`${col} = $${i++}`); values.push(val); }
  }
  if (setClauses.length === 0) return null;
  values.push(idPromocion);
  const { rows } = await client.query(
    `UPDATE promociones SET ${setClauses.join(', ')} WHERE id_promocion = $${i} RETURNING *`,
    values,
  );
  return rows[0] || null;
}

async function remove(idPromocion, client = db) {
  await client.query('UPDATE promociones SET activo = false WHERE id_promocion = $1', [idPromocion]);
}

module.exports = { findAll, findById, findByCodigo, create, update, remove };
