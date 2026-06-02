/**
 * server.js
 * ---------
 * Punto de entrada de la aplicación.
 *   1. Verifica conectividad con PostgreSQL (falla rápido si no hay BD).
 *   2. Levanta el servidor HTTP.
 *   3. Registra handlers para shutdown ordenado (SIGINT/SIGTERM).
 */
'use strict';

const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const db = require('./config/db');

(async () => {
  try {
    const now = await db.ping();
    logger.info(`✅ Conectado a PostgreSQL (${env.db.database}) — ${now}`);
  } catch (err) {
    logger.error('❌ No se pudo conectar a PostgreSQL', { error: err.message });
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    logger.info(`🚀 Pet Spa API escuchando en http://localhost:${env.port} (${env.nodeEnv})`);
  });

  // Shutdown ordenado: cerrar HTTP y pool de BD
  const shutdown = async (signal) => {
    logger.info(`Recibido ${signal}, cerrando...`);
    server.close(() => logger.info('Servidor HTTP cerrado'));
    try {
      await db.pool.end();
      logger.info('Pool de PostgreSQL cerrado');
      process.exit(0);
    } catch (err) {
      logger.error('Error al cerrar pool', { error: err.message });
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`❌ Puerto ${env.port} ya está en uso. Cierra el proceso anterior e intenta de nuevo.`);
    } else {
      logger.error('Error de servidor', { error: err.message });
    }
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('UnhandledRejection', { reason: String(reason) });
  });
  process.on('uncaughtException', (err) => {
    logger.error('UncaughtException', { error: err.message, stack: err.stack });
    process.exit(1);
  });
})();
