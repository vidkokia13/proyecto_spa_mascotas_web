'use strict';

const db = require('../config/db');

async function log(data, client = db) {
  const sql = `
    INSERT INTO audit_log (id_usuario, accion, detalle, ip_address, user_agent)
    VALUES ($1, $2, $3, $4, $5)
  `;
  await client.query(sql, [
    data.idUsuario || null,
    data.accion,
    data.detalle || null,
    data.ipAddress || null,
    data.userAgent || null,
  ]);
}

async function findAll({ limit = 100, offset = 0, accion = null } = {}, client = db) {
  const params = [];
  let where = '';
  if (accion) {
    params.push(accion);
    where = `WHERE l.accion = $${params.length}`;
  }
  params.push(limit, offset);
  const sql = `
    SELECT l.id_log,
           l.id_usuario,
           u.nombre      AS nombre_usuario,
           u.email       AS email_usuario,
           l.accion,
           l.detalle,
           l.ip_address,
           l.user_agent,
           l.fecha
      FROM audit_log l
      LEFT JOIN usuarios u ON u.id_usuario = l.id_usuario
    ${where}
    ORDER BY l.fecha DESC
    LIMIT  $${params.length - 1}
    OFFSET $${params.length}
  `;
  const { rows } = await client.query(sql, params);
  return rows;
}

module.exports = { log, findAll };
