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

async function create({ nombre, unidad = 'unidad', stock = 0, stockMinimo = 5 }, client = db) {
  const { rows } = await client.query(
    `INSERT INTO insumos (nombre, unidad, stock, stock_minimo) VALUES ($1,$2,$3,$4) RETURNING *`,
    [nombre, unidad, stock, stockMinimo],
  );
  return rows[0];
}

async function update(idInsumo, fields, client = db) {
  const colMap = { nombre: 'nombre', unidad: 'unidad', stock: 'stock', activo: 'activo', stock_minimo: 'stock_minimo', stockMinimo: 'stock_minimo' };
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

async function findBajoStock(client = db) {
  const { rows } = await client.query(
    `SELECT * FROM insumos WHERE activo = true AND stock <= stock_minimo ORDER BY stock ASC, nombre`,
  );
  return rows;
}

async function findPrediccion(client = db) {
  const { rows } = await client.query(
    `SELECT
       i.id_insumo,
       i.nombre,
       i.unidad,
       i.stock,
       i.stock_minimo,
       COUNT(ci.id_cita_insumo)::int           AS num_servicios,
       COALESCE(SUM(ci.cantidad_recibida), 0)  AS total_recibido,
       COALESCE(SUM(ci.cantidad_usada), 0)     AS total_usado,
       COALESCE(SUM(ci.desperdicio), 0)        AS total_desperdicio,
       COALESCE(AVG(ci.cantidad_usada), 0)     AS promedio_uso
     FROM insumos i
     LEFT JOIN cita_insumos ci ON i.id_insumo = ci.id_insumo
     WHERE i.activo = true
     GROUP BY i.id_insumo, i.nombre, i.unidad, i.stock, i.stock_minimo
     ORDER BY i.nombre`,
  );
  return rows;
}

async function findLog({ idTrabajador = null, fecha = null } = {}, client = db) {
  const conditions = [];
  const vals = [];
  let i = 1;
  if (idTrabajador) { conditions.push(`c.id_trabajador = $${i++}`); vals.push(idTrabajador); }
  if (fecha)        { conditions.push(`DATE(ci.creado_en) = $${i++}`); vals.push(fecha); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await client.query(
    `SELECT
       ci.id_cita_insumo,
       ci.id_cita,
       ci.id_insumo,
       ci.cantidad_recibida,
       ci.cantidad_usada,
       ci.cantidad_devuelta,
       ci.desperdicio,
       ci.creado_en,
       i.nombre  AS nombre_insumo,
       i.unidad,
       t.id_trabajador,
       u.nombre  AS nombre_groomer
     FROM cita_insumos ci
     JOIN insumos     i ON ci.id_insumo   = i.id_insumo
     JOIN citas       c ON ci.id_cita     = c.id_cita
     LEFT JOIN trabajadores t ON c.id_trabajador = t.id_trabajador
     LEFT JOIN usuarios     u ON t.id_usuario    = u.id_usuario
     ${where}
     ORDER BY ci.creado_en DESC
     LIMIT 300`,
    vals,
  );
  return rows;
}

module.exports = { findAll, findById, create, update, adjustStock, findBajoStock, findByCita, createCitaInsumo, updateCitaInsumo, findLog, findPrediccion };
