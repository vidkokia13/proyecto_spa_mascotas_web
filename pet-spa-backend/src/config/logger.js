/**
 * config/logger.js
 * ----------------
 * Logger centralizado basado en winston.
 * - En desarrollo: salida coloreada y legible en consola.
 * - En producción: salida JSON estructurada (apta para agregadores).
 */
'use strict';

const winston = require('winston');

const isDev = (process.env.NODE_ENV || 'development') === 'development';

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${metaStr}`;
  }),
);

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: isDev ? devFormat : prodFormat,
  transports: [
    new winston.transports.Console(),
  ],
});

module.exports = logger;
