'use strict';

const db = require('../config/db');

const FULL_SELECT = `
  SELECT u.id_usuario,
         u.id_rol,
         r.nombre            AS rol,
         u.nombre,
         u.email,
         u.password_hash,
         u.estado,
         u.two_factor_enabled,
         u.two_factor_secret,
         u.ultimo_acceso,
         u.failed_attempts,
         u.locked_until,
         u.force_password_change
    FROM usuarios u
    JOIN roles r ON r.id_rol = u.id_rol
`;

async function findByEmail(email, client = db) {
  const { rows } = await client.query(
    `${FULL_SELECT} WHERE LOWER(u.email) = LOWER($1) LIMIT 1`,
    [email],
  );
  return rows[0] || null;
}

async function findById(idUsuario, client = db) {
  const { rows } = await client.query(
    `${FULL_SELECT} WHERE u.id_usuario = $1 LIMIT 1`,
    [idUsuario],
  );
  return rows[0] || null;
}

async function findByIdWithProfile(idUsuario, client = db) {
  const sql = `
    SELECT u.id_usuario,
           u.id_rol,
           r.nombre            AS rol,
           u.nombre,
           u.email,
           u.estado,
           u.two_factor_enabled,
           u.ultimo_acceso,
           u.force_password_change,
           c.id_cliente,
           t.id_trabajador
      FROM usuarios u
      JOIN roles r ON r.id_rol = u.id_rol
      LEFT JOIN clientes     c ON c.id_usuario = u.id_usuario
      LEFT JOIN trabajadores t ON t.id_usuario = u.id_usuario
     WHERE u.id_usuario = $1
     LIMIT 1
  `;
  const { rows } = await client.query(sql, [idUsuario]);
  return rows[0] || null;
}

async function create(data, client = db) {
  const sql = `
    INSERT INTO usuarios (id_rol, nombre, email, password_hash, estado, force_password_change)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id_usuario, id_rol, nombre, email, estado, force_password_change
  `;
  const { rows } = await client.query(sql, [
    data.idRol,
    data.nombre,
    data.email,
    data.passwordHash,
    data.estado || 'activo',
    data.forcePasswordChange ?? false,
  ]);
  return rows[0];
}

async function updateEstado(idUsuario, estado, client = db) {
  const { rows } = await client.query(
    'UPDATE usuarios SET estado = $2 WHERE id_usuario = $1 RETURNING id_usuario, estado',
    [idUsuario, estado],
  );
  return rows[0] || null;
}

async function updateLastAccess(idUsuario, ip, userAgent, client = db) {
  await client.query(
    `UPDATE usuarios
        SET ultimo_acceso = NOW(), ip_ultimo_acceso = $2, user_agent = $3
      WHERE id_usuario = $1`,
    [idUsuario, ip, userAgent],
  );
}

async function updatePassword(idUsuario, passwordHash, client = db) {
  await client.query(
    'UPDATE usuarios SET password_hash = $2 WHERE id_usuario = $1',
    [idUsuario, passwordHash],
  );
}

async function setForcePasswordChange(idUsuario, val, client = db) {
  await client.query(
    'UPDATE usuarios SET force_password_change = $2 WHERE id_usuario = $1',
    [idUsuario, val],
  );
}

async function incrementFailedAttempts(idUsuario, client = db) {
  await client.query(
    'UPDATE usuarios SET failed_attempts = failed_attempts + 1 WHERE id_usuario = $1',
    [idUsuario],
  );
}

async function resetFailedAttempts(idUsuario, client = db) {
  await client.query(
    'UPDATE usuarios SET failed_attempts = 0, locked_until = NULL WHERE id_usuario = $1',
    [idUsuario],
  );
}

async function lockAccount(idUsuario, until, client = db) {
  await client.query(
    'UPDATE usuarios SET failed_attempts = 5, locked_until = $2 WHERE id_usuario = $1',
    [idUsuario, until],
  );
}

async function set2FASecret(idUsuario, secret, client = db) {
  await client.query(
    'UPDATE usuarios SET two_factor_secret = $2 WHERE id_usuario = $1',
    [idUsuario, secret],
  );
}

async function enable2FA(idUsuario, client = db) {
  await client.query(
    'UPDATE usuarios SET two_factor_enabled = true WHERE id_usuario = $1',
    [idUsuario],
  );
}

async function disable2FA(idUsuario, client = db) {
  await client.query(
    'UPDATE usuarios SET two_factor_enabled = false, two_factor_secret = NULL WHERE id_usuario = $1',
    [idUsuario],
  );
}

async function emailExists(email, client = db) {
  const { rows } = await client.query(
    'SELECT 1 FROM usuarios WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [email],
  );
  return rows.length > 0;
}

module.exports = {
  findByEmail,
  findById,
  findByIdWithProfile,
  create,
  updateEstado,
  updateLastAccess,
  updatePassword,
  setForcePasswordChange,
  incrementFailedAttempts,
  resetFailedAttempts,
  lockAccount,
  set2FASecret,
  enable2FA,
  disable2FA,
  emailExists,
};
