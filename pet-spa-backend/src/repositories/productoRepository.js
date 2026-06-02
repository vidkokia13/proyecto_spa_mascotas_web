'use strict';

const db = require('../config/db');

async function findAll({ categoria, buscar, soloActivos = true } = {}, client = db) {
  const conditions = [];
  const values = [];
  let i = 1;

  if (soloActivos) { conditions.push(`p.activo = true`); }
  if (categoria)   { conditions.push(`p.categoria = $${i++}`); values.push(categoria); }
  if (buscar)      { conditions.push(`p.nombre ILIKE $${i++}`); values.push(`%${buscar}%`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await client.query(
    `SELECT * FROM productos p ${where} ORDER BY p.nombre`,
    values,
  );
  return rows;
}

async function findById(idProducto, client = db) {
  const { rows } = await client.query(
    'SELECT * FROM productos WHERE id_producto = $1',
    [idProducto],
  );
  return rows[0] || null;
}

async function create(fields, client = db) {
  const { nombre, descripcion, categoria, precio, stock, stockMinimo,
          imagenUrl, imagenPublicId } = fields;
  const { rows } = await client.query(
    `INSERT INTO productos
       (nombre, descripcion, categoria, precio, stock, stock_minimo, imagen_url, imagen_public_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [nombre, descripcion, categoria, precio, stock, stockMinimo ?? 5,
     imagenUrl ?? null, imagenPublicId ?? null],
  );
  return rows[0];
}

async function update(idProducto, fields, client = db) {
  const allowed = ['nombre','descripcion','categoria','precio','stock','stock_minimo',
                   'imagen_url','imagen_public_id','activo'];
  const setClauses = [];
  const values = [];
  let i = 1;
  for (const [key, val] of Object.entries(fields)) {
    if (allowed.includes(key)) { setClauses.push(`${key} = $${i++}`); values.push(val); }
  }
  if (setClauses.length === 0) return null;
  values.push(idProducto);
  const { rows } = await client.query(
    `UPDATE productos SET ${setClauses.join(', ')} WHERE id_producto = $${i} RETURNING *`,
    values,
  );
  return rows[0] || null;
}

async function remove(idProducto, client = db) {
  const { rows } = await client.query(
    'UPDATE productos SET activo = false WHERE id_producto = $1 RETURNING *',
    [idProducto],
  );
  return rows[0] || null;
}

async function descontarStock(idProducto, cantidad, client = db) {
  const { rows } = await client.query(
    `UPDATE productos SET stock = stock - $2
     WHERE id_producto = $1 AND stock >= $2
     RETURNING *`,
    [idProducto, cantidad],
  );
  return rows[0] || null;
}

module.exports = { findAll, findById, create, update, remove, descontarStock };
