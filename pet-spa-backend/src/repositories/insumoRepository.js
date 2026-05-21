'use strict';

const db = require('../config/db');

// ── Catálogo ─────────────────────────────────────────────────────────────────

async function findAll({ soloActivos = true } = {}, client = db) {
  const where = soloActivos ? 'WHERE activo = true' : '';
  const { rows } = await client.query(
    `SELECT * FROM insumos ${where} ORDER BY nombre`, [],
  );
  return rows;
}

async function findById(idInsumo, client = db) {
  const { rows } = await client.query('SELECT * FROM insumos WHERE id_insumo = $1', [idInsumo]);
  return rows[0] || null;
}

async function create({ nombre, unidad = 'unidad', stock = 0 }, client = db) {
  const { rows } = await client.query(
    `INSERT INTO insumos (nombre, unidad, stock) VALUES ($1,$2,$3) RETURNING *`,
    [nombre, unidad, stock],
  );
  return rows[0];
}

async function update(idInsumo, fields, client = db) {
  const colMap = { nombre: 'nombre', unidad: 'unidad', stock: 'stock', activo: 'activo' };
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(fields)) {
    if (colMap[k]) { sets.push(`${colMap[k]} = $${i++}`); vals.push(v); }
  }
  if (!sets.length) return null;
  vals.push(idInsumo);
  const { rows } = await client.query(
    `UPDATE insumos SET ${sets.join(', ')} WHERE id_insumo = $${i} RETURNING *`, vals,
  );
  return rows[0] || null;
}

async function adjustStock(idInsumo, delta, client = db) {
  const { rows } = await client.query(
    `UPDATE insumos SET stock = stock + $1 WHERE id_insumo = $2 RETURNING *`,
    [delta, idInsumo],
  );
  return rows[0] || null;
}

// ── Cita insumos ─────────────────────────────────────────────────────────────

async function findByCita(idCita, client = db) {
  const { rows } = await client.query(
    `SELECT ci.*, i.nombre AS nombre_insumo, i.unidad
     FROM cita_insumos ci
     JOIN insumos i ON ci.id_insumo = i.id_insumo
     WHERE ci.id_cita = $1
     ORDER BY i.nombre`,
    [idCita],
  );
  return rows;
}

async function createCitaInsumo({ idCita, idInsumo, cantidadRecibida = 0, cantidadUsada = 0,
  cantidadDevuelta = 0, desperdicio = 0, registradoPor = null }, client = db) {
  const { rows } = await client.query(
    `INSERT INTO cita_insumos
       (id_cita, id_insumo, cantidad_recibida, cantidad_usada, cantidad_devuelta, desperdicio, registrado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [idCita, idInsumo, cantidadRecibida, cantidadUsada, cantidadDevuelta, desperdicio, registradoPor],
  );
  return rows[0];
}

async function updateCitaInsumo(idCitaInsumo, fields, client = db) {
  const colMap = {
    cantidad_recibida: 'cantidad_recibida', cantidadRecibida: 'cantidad_recibida',
    cantidad_usada:    'cantidad_usada',    cantidadUsada:    'cantidad_usada',
    cantidad_devuelta: 'cantidad_devuelta', cantidadDevuelta: 'cantidad_devuelta',
    desperdicio:       'desperdicio',
  };
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(fields)) {
    if (colMap[k]) { sets.push(`${colMap[k]} = $${i++}`); vals.push(v); }
  }
  if (!sets.length) return null;
  vals.push(idCitaInsumo);
  const { rows } = await client.query(
    `UPDATE cita_insumos SET ${sets.join(', ')} WHERE id_cita_insumo = $${i} RETURNING *`, vals,
  );
  return rows[0] || null;
}

module.exports = { findAll, findById, create, update, adjustStock, findByCita, createCitaInsumo, updateCitaInsumo };
