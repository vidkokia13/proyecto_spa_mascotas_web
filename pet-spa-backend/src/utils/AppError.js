/**
 * utils/AppError.js
 * -----------------
 * Error operacional con statusCode HTTP. Permite al middleware de errores
 * distinguir errores esperados (validaciones, 404, 401, 403) de bugs reales.
 */
'use strict';

class AppError extends Error {
  /**
   * @param {string} message  Mensaje al cliente
   * @param {number} statusCode  HTTP status (default 500)
   * @param {string} [code]  Código corto opcional (e.g. 'EMAIL_TAKEN')
   * @param {object} [details]  Info adicional (campos inválidos, etc.)
   */
  constructor(message, statusCode = 500, code = undefined, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
