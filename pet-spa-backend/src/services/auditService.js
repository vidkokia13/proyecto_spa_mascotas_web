/**
 * services/auditService.js
 * ------------------------
 * Wrapper sobre auditRepository que captura errores: una falla al
 * registrar auditoría NUNCA debe romper la operación principal
 * (registrar un usuario, crear un empleado, etc.).
 */
'use strict';

const auditRepo = require('../repositories/auditRepository');
const logger = require('../config/logger');

async function log(payload, client) {
  try {
    await auditRepo.log(payload, client);
  } catch (err) {
    logger.error('No se pudo registrar audit_log', {
      error: err.message,
      payload,
    });
  }
}

module.exports = { log };
