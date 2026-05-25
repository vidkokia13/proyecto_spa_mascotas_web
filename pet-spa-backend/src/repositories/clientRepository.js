/**
 * repositories/clientRepository.js
 * --------------------------------
 * Acceso a la tabla `clientes` (1:1 con usuarios cuando rol = 'cliente').
 */
'use strict';

const db = require('../config/db');

/**
 * Crea el registro de cliente vinculado a un id_usuario.
 *
 * @param {object} data
 * @param {string} data.idUsuario  UUID
 * @param {string} [data.telefono]
 * @param {string} [data.direccion]
 * @param {string} [data.ci]
 * @param {string} [data.canalNotificacion]   p.ej. 'email', 'whatsapp'
 * @param {string} [data.horariosPreferidos]
 */
async function create(data, client = db) {
  const sql = `
    INSERT INTO clientes (
      id_usuario, telefono, direccion, ci,
      canal_notificacion, horarios_preferidos
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id_cliente, id_usuario, telefono, direccion, ci,
              canal_notificacion, horarios_preferidos
  `;
  const params = [
    data.idUsuario,
    data.telefono || null,
    data.direccion || null,
    data.ci || null,
    data.canalNotificacion || 'email',
    data.horariosPreferidos || null,
  ];
  const { rows } = await client.query(sql, params);
  return rows[0];
}

async function findByUserId(idUsuario, client = db) {
  const { rows } = await client.query(
    'SELECT * FROM clientes WHERE id_usuario = $1 LIMIT 1',
    [idUsuario],
  );
  return rows[0] || null;
}

module.exports = { create, findByUserId };
