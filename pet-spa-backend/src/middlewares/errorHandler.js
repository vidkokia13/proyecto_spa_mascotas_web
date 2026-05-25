/**
 * middlewares/errorHandler.js
 * ---------------------------
 * Middleware central de manejo de errores. Distingue:
 *   - AppError (operacional, esperado)  -> respuesta limpia con su statusCode
 *   - Errores de PostgreSQL conocidos   -> traduce algunos códigos comunes
 *   - Cualquier otro                    -> 500 genérico (sin filtrar stack en prod)
 *
 * Y un helper `notFound` para rutas no existentes.
 */
'use strict';

const AppError = require('../utils/AppError');
const logger = require('../config/logger');
const env = require('../config/env');

function notFound(req, _res, next) {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  // Errores conocidos de pg → traducir a AppError
  if (err && err.code && !err.isOperational) {
    if (err.code === '23505') { // unique_violation
      err = new AppError('Registro duplicado (violación de unicidad)', 409, 'DUPLICATE');
    } else if (err.code === '23503') { // foreign_key_violation
      err = new AppError('Referencia inválida (foreign key)', 400, 'FK_VIOLATION');
    } else if (err.code === '23502') { // not_null_violation
      const col = err.column ? ` (columna: ${err.table}.${err.column})` : '';
      logger.warn(`NOT_NULL violation${col}`, { table: err.table, column: err.column });
      err = new AppError('Falta un campo obligatorio', 400, 'NOT_NULL');
    } else if (err.code === '22P02') { // invalid_text_representation (e.g. UUID malformado)
      err = new AppError('Formato de dato inválido', 400, 'INVALID_INPUT');
    }
  }

  const status = err.statusCode || 500;
  const isOperational = err.isOperational === true;

  // Loggear: warn para 4xx, error para 5xx
  const logPayload = {
    method: req.method,
    url: req.originalUrl,
    status,
    code: err.code,
    message: err.message,
    ...(env.nodeEnv === 'development' ? { stack: err.stack } : {}),
  };

  if (status >= 500) {
    logger.error('Error no controlado', logPayload);
  } else {
    logger.warn('Error operacional', logPayload);
  }

  res.status(status).json({
    error: {
      message: isOperational || status < 500
        ? err.message
        : 'Ocurrió un error en el servidor',
      code: err.code || 'INTERNAL',
      ...(err.details ? { details: err.details } : {}),
      ...(env.nodeEnv === 'development' && status >= 500 ? { stack: err.stack } : {}),
    },
  });
}

module.exports = { errorHandler, notFound };
