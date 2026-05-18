/**
 * repositories/roleRepository.js
 * ------------------------------
 * Acceso a la tabla `roles`.
 */
'use strict';

const db = require('../config/db');

/**
 * Devuelve un rol por su nombre (e.g. 'cliente', 'admin').
 */
async function findByName(nombre, client = db) {
  const { rows } = await client.query(
    'SELECT id_rol, nombre FROM roles WHERE nombre = $1 LIMIT 1',
    [nombre],
  );
  return rows[0] || null;
}

/**
 * Devuelve un rol por su id.
 */
async function findById(idRol, client = db) {
  const { rows } = await client.query(
    'SELECT id_rol, nombre FROM roles WHERE id_rol = $1 LIMIT 1',
    [idRol],
  );
  return rows[0] || null;
}

module.exports = { findByName, findById };
