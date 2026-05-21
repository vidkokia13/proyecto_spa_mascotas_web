'use strict';

// Actual DB columns: duracion_estimada_min (= duracion_base), precio (= precio_base)
// We expose them under their actual names in queries and alias for API consistency.

const db = require('../config/db');

async function findAll({ soloActivos = true } = {}, client = db) {
  const where = soloActivos ? 'WHERE activo = true' : '';
  const { rows } = await client.query(
    `SELECT id_servicio, nombre, descripcion,
            duracion_estimada_min AS duracion_base,
            precio AS precio_base, categoria, activo, creado_en
     FROM servicios ${where}
     ORDER BY duracion_estimada_min`,
  );
  return rows;
}

async function findById(idServicio, client = db) {
  const { rows } = await client.query(
    `SELECT id_servicio, nombre, descripcion,
            duracion_estimada_min AS duracion_base,
            precio AS precio_base, categoria, activo, creado_en
     FROM servicios WHERE id_servicio = $1`,
    [idServicio],
  );
  return rows[0] || null;
}

async function create({ nombre, descripcion = null, duracionBase, precioBase = 0, categoria = null }, client = db) {
  const { rows } = await client.query(
    `INSERT INTO servicios (nombre, descripcion, duracion_estimada_min, precio, categoria)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id_servicio, nombre, descripcion,
               duracion_estimada_min AS duracion_base, precio AS precio_base, categoria, activo, creado_en`,
    [nombre, descripcion, duracionBase, precioBase, categoria],
  );
  return rows[0];
}

async function update(idServicio, fields, client = db) {
  // Map API field names → actual column names
  const colMap = {
    nombre:       'nombre',
    descripcion:  'descripcion',
    duracion_base: 'duracion_estimada_min',
    duracionBase: 'duracion_estimada_min',
    precio_base:  'precio',
    precioBase:   'precio',
    categoria:    'categoria',
    activo:       'activo',
  };
  const setClauses = [];
  const values = [];
  let i = 1;
  for (const [key, val] of Object.entries(fields)) {
    const col = colMap[key];
    if (col) { setClauses.push(`${col} = $${i++}`); values.push(val); }
  }
  if (setClauses.length === 0) return null;
  values.push(idServicio);
  const { rows } = await client.query(
    `UPDATE servicios SET ${setClauses.join(', ')} WHERE id_servicio = $${i}
     RETURNING id_servicio, nombre, descripcion,
               duracion_estimada_min AS duracion_base, precio AS precio_base, categoria, activo, creado_en`,
    values,
  );
  return rows[0] || null;
}

module.exports = { findAll, findById, create, update };
