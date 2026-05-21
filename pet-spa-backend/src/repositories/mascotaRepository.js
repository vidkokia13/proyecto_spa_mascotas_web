'use strict';

const db = require('../config/db');

// mascotas.id_cliente → clientes.id_cliente → usuarios.id_usuario
// All public-facing methods accept idUsuario; internally we join clientes.

async function create({ idCliente, nombre, especie = 'perro', raza = null, tamano = 'mediano',
  temperamento = 'tranquilo', tiempoExtraMin = 0, pesoKg = null, notas = null }, client = db) {
  const { rows } = await client.query(
    `INSERT INTO mascotas (id_cliente, nombre, especie, raza, tamano, temperamento, tiempo_extra_min, peso_kg, notas)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [idCliente, nombre, especie, raza, tamano, temperamento, tiempoExtraMin, pesoKg, notas],
  );
  return rows[0];
}

async function findById(idMascota, client = db) {
  const { rows } = await client.query(
    `SELECT m.*, c.id_usuario FROM mascotas m
     JOIN clientes c ON m.id_cliente = c.id_cliente
     WHERE m.id_mascota = $1`,
    [idMascota],
  );
  return rows[0] || null;
}

async function findByUserId(idUsuario, client = db) {
  const { rows } = await client.query(
    `SELECT m.* FROM mascotas m
     JOIN clientes c ON m.id_cliente = c.id_cliente
     WHERE c.id_usuario = $1 AND m.activo = true
     ORDER BY m.nombre`,
    [idUsuario],
  );
  return rows;
}

async function findByClienteId(idCliente, client = db) {
  const { rows } = await client.query(
    'SELECT * FROM mascotas WHERE id_cliente = $1 AND activo = true ORDER BY nombre',
    [idCliente],
  );
  return rows;
}

async function update(idMascota, fields, client = db) {
  const allowed = ['nombre','especie','raza','tamano','temperamento','tiempo_extra_min','peso_kg','notas','activo','foto_url'];
  const setClauses = [];
  const values = [];
  let i = 1;
  for (const [key, val] of Object.entries(fields)) {
    if (allowed.includes(key)) { setClauses.push(`${key} = $${i++}`); values.push(val); }
  }
  if (setClauses.length === 0) return null;
  values.push(idMascota);
  const { rows } = await client.query(
    `UPDATE mascotas SET ${setClauses.join(', ')} WHERE id_mascota = $${i} RETURNING *`,
    values,
  );
  return rows[0] || null;
}

async function remove(idMascota, client = db) {
  await client.query('UPDATE mascotas SET activo = false WHERE id_mascota = $1', [idMascota]);
}

module.exports = { create, findById, findByUserId, findByClienteId, update, remove };
