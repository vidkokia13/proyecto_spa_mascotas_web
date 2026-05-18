/**
 * config/db.js
 * -------------
 * Pool de conexiones a PostgreSQL (BD pet_spa) usando `pg`.
 *
 * Exporta:
 *  - query(text, params): wrapper de pool.query con logging.
 *  - getClient(): obtiene un cliente para transacciones manuales.
 *  - withTransaction(fn): ejecuta fn(client) dentro de BEGIN/COMMIT/ROLLBACK.
 *
 * Todas las queries del proyecto deben pasar por aquí (parametrizadas siempre).
 */
'use strict';

const { Pool } = require('pg');
const env = require('./env');
const logger = require('./logger');

const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,
  max: env.db.poolMax,
  idleTimeoutMillis: env.db.idleTimeoutMs,
  // Exigir SSL en producción si tu hosting lo requiere:
  // ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  logger.error('Error inesperado en el pool de PostgreSQL', { error: err.message });
});

/**
 * Ejecuta una query parametrizada.
 * @param {string} text  SQL con placeholders $1, $2, ...
 * @param {Array}  params  Valores
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (env.nodeEnv === 'development') {
      logger.debug('SQL ejecutado', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (err) {
    logger.error('Error en query SQL', { text, error: err.message });
    throw err;
  }
}

/**
 * Obtiene un cliente del pool. Recordá hacer client.release() siempre.
 */
function getClient() {
  return pool.connect();
}

/**
 * Ejecuta `fn` dentro de una transacción. Hace COMMIT si no lanza,
 * ROLLBACK si lanza. Devuelve lo que devuelva fn.
 *
 * @example
 *   const userId = await withTransaction(async (client) => {
 *     const u = await client.query('INSERT ... RETURNING id_usuario', [...]);
 *     await client.query('INSERT INTO clientes ...', [...]);
 *     return u.rows[0].id_usuario;
 *   });
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* noop */ }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Verifica conectividad. Útil al arrancar el servidor.
 */
async function ping() {
  const res = await pool.query('SELECT NOW() AS now');
  return res.rows[0].now;
}

module.exports = {
  pool,
  query,
  getClient,
  withTransaction,
  ping,
};
