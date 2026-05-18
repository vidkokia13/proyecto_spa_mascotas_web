/**
 * repositories/workerRepository.js
 * --------------------------------
 * Acceso a la tabla `trabajadores` (1:1 con usuarios cuando rol es
 * trabajador, admin o jefe).
 */
'use strict';

const db = require('../config/db');

async function create(data, client = db) {
  const sql = `
    INSERT INTO trabajadores (
      id_usuario, sueldo_mensual, activo, turno,
      telefono, especialidad, capacidad_simultanea
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id_trabajador, id_usuario, sueldo_mensual, activo,
              turno, telefono, especialidad, capacidad_simultanea
  `;
  const params = [
    data.idUsuario,
    data.sueldoMensual ?? null,
    data.activo ?? true,
    data.turno || null,
    data.telefono || null,
    data.especialidad || null,
    data.capacidadSimultanea ?? 1,
  ];
  const { rows } = await client.query(sql, params);
  return rows[0];
}

async function findByUserId(idUsuario, client = db) {
  const { rows } = await client.query(
    'SELECT * FROM trabajadores WHERE id_usuario = $1 LIMIT 1',
    [idUsuario],
  );
  return rows[0] || null;
}

/**
 * Lista todos los empleados con datos de usuario y rol.
 */
async function listAll(client = db) {
  const sql = `
    SELECT u.id_usuario,
           u.nombre,
           u.email,
           u.estado,
           r.nombre AS rol,
           t.id_trabajador,
           t.turno,
           t.especialidad,
           t.activo,
           t.telefono,
           t.sueldo_mensual,
           t.capacidad_simultanea
      FROM trabajadores t
      JOIN usuarios u ON u.id_usuario = t.id_usuario
      JOIN roles    r ON r.id_rol = u.id_rol
     ORDER BY u.nombre ASC
  `;
  const { rows } = await client.query(sql);
  return rows;
}

async function findDetailedByUserId(idUsuario, client = db) {
  const sql = `
    SELECT u.id_usuario,
           u.nombre,
           u.email,
           u.estado,
           r.nombre AS rol,
           t.id_trabajador,
           t.turno,
           t.especialidad,
           t.activo,
           t.telefono,
           t.sueldo_mensual,
           t.capacidad_simultanea
      FROM trabajadores t
      JOIN usuarios u ON u.id_usuario = t.id_usuario
      JOIN roles    r ON r.id_rol = u.id_rol
     WHERE u.id_usuario = $1
     LIMIT 1
  `;
  const { rows } = await client.query(sql, [idUsuario]);
  return rows[0] || null;
}

/**
 * Actualiza campos de la tabla `trabajadores` solamente.
 * Construye un UPDATE dinámico seguro (con whitelist de columnas).
 */
async function updateByUserId(idUsuario, fields, client = db) {
  const allowed = {
    turno: 'turno',
    especialidad: 'especialidad',
    activo: 'activo',
    telefono: 'telefono',
    sueldoMensual: 'sueldo_mensual',
    capacidadSimultanea: 'capacidad_simultanea',
  };

  const sets = [];
  const values = [];
  let i = 1;

  for (const [key, col] of Object.entries(allowed)) {
    if (fields[key] !== undefined) {
      sets.push(`${col} = $${i++}`);
      values.push(fields[key]);
    }
  }

  if (sets.length === 0) return null;

  values.push(idUsuario);
  const sql = `
    UPDATE trabajadores
       SET ${sets.join(', ')}
     WHERE id_usuario = $${i}
     RETURNING id_trabajador, id_usuario
  `;
  const { rows } = await client.query(sql, values);
  return rows[0] || null;
}

module.exports = {
  create,
  findByUserId,
  findDetailedByUserId,
  listAll,
  updateByUserId,
};
