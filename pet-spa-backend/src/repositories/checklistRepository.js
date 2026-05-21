'use strict';

const db = require('../config/db');

// ── Items (template) ─────────────────────────────────────────────────────────

async function findItems({ idServicio = null, soloActivos = true } = {}, client = db) {
  const conditions = soloActivos ? ['ci.activo = true'] : [];
  const params = [];
  if (idServicio !== undefined) {
    params.push(idServicio);
    conditions.push(`(ci.id_servicio = $${params.length} OR ci.id_servicio IS NULL)`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await client.query(
    `SELECT ci.*, s.nombre AS nombre_servicio
     FROM checklist_items ci
     LEFT JOIN servicios s ON ci.id_servicio = s.id_servicio
     ${where}
     ORDER BY ci.orden, ci.descripcion`,
    params,
  );
  return rows;
}

async function createItem({ idServicio = null, descripcion, orden = 0 }, client = db) {
  const { rows } = await client.query(
    `INSERT INTO checklist_items (id_servicio, descripcion, orden)
     VALUES ($1,$2,$3) RETURNING *`,
    [idServicio, descripcion, orden],
  );
  return rows[0];
}

async function updateItem(idItem, fields, client = db) {
  const colMap = { descripcion: 'descripcion', orden: 'orden', activo: 'activo', id_servicio: 'id_servicio' };
  const sets = []; const vals = []; let i = 1;
  for (const [k, v] of Object.entries(fields)) {
    if (colMap[k]) { sets.push(`${colMap[k]} = $${i++}`); vals.push(v); }
  }
  if (!sets.length) return null;
  vals.push(idItem);
  const { rows } = await client.query(
    `UPDATE checklist_items SET ${sets.join(', ')} WHERE id_item = $${i} RETURNING *`, vals,
  );
  return rows[0] || null;
}

// ── Cita checklist (instance) ────────────────────────────────────────────────

async function initCitaChecklist(idCita, idServicio, client = db) {
  // Insert all applicable items for this cita (global + service-specific), ignore conflicts
  await client.query(
    `INSERT INTO cita_checklist (id_cita, id_item)
     SELECT $1, id_item FROM checklist_items
     WHERE activo = true AND (id_servicio = $2 OR id_servicio IS NULL)
     ON CONFLICT DO NOTHING`,
    [idCita, idServicio],
  );
}

async function findCitaChecklist(idCita, client = db) {
  const { rows } = await client.query(
    `SELECT cc.*, ci.descripcion, ci.orden
     FROM cita_checklist cc
     JOIN checklist_items ci ON cc.id_item = ci.id_item
     WHERE cc.id_cita = $1
     ORDER BY ci.orden`,
    [idCita],
  );
  return rows;
}

async function toggleItem(idCita, idItem, completado, client = db) {
  const { rows } = await client.query(
    `UPDATE cita_checklist
     SET completado = $1, completado_en = $2
     WHERE id_cita = $3 AND id_item = $4
     RETURNING *`,
    [completado, completado ? new Date() : null, idCita, idItem],
  );
  return rows[0] || null;
}

module.exports = { findItems, createItem, updateItem, initCitaChecklist, findCitaChecklist, toggleItem };
