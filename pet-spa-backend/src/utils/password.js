/**
 * utils/password.js
 * -----------------
 * Helpers para hash y comparación de contraseñas con bcrypt.
 * El cost (saltRounds) se configura por .env (default 12).
 */
'use strict';

const bcrypt = require('bcrypt');
const env = require('../config/env');

/**
 * Hashea una contraseña en texto plano.
 * @param {string} plain
 * @returns {Promise<string>} hash bcrypt
 */
async function hashPassword(plain) {
  return bcrypt.hash(plain, env.bcrypt.saltRounds);
}

/**
 * Compara una contraseña en texto plano con un hash almacenado.
 * @param {string} plain
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function verifyPassword(plain, hash) {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, verifyPassword };
