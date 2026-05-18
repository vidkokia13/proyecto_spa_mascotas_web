/**
 * utils/jwt.js
 * ------------
 * Helpers para firmar y verificar JSON Web Tokens.
 *
 * El payload típico de Pet Spa contiene:
 *   - id_usuario  (UUID)
 *   - id_rol      (int)
 *   - rol         (nombre del rol, p.ej. 'cliente' / 'admin')
 *   - id_cliente  (UUID, si aplica)
 *   - id_trabajador (UUID, si aplica)
 *
 * Estos campos los consumen los módulos de citas, grooming y caja.
 */
'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('./AppError');

/**
 * Firma un payload y devuelve el token.
 * @param {object} payload
 * @returns {string} JWT
 */
function signToken(payload) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

/**
 * Verifica y decodifica un token. Lanza AppError 401 si falla.
 * @param {string} token
 * @returns {object} payload
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, env.jwt.secret);
  } catch (err) {
    throw new AppError('Token inválido o expirado', 401, 'INVALID_TOKEN');
  }
}

module.exports = { signToken, verifyToken };
