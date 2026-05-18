'use strict';

const auditRepo = require('../repositories/auditRepository');

async function getLogs(req, res) {
  const limit  = Math.min(parseInt(req.query.limit  || '100'), 500);
  const offset = parseInt(req.query.offset || '0');
  const accion = req.query.accion || null;

  const logs = await auditRepo.findAll({ limit, offset, accion });
  res.json({ logs, total: logs.length, limit, offset });
}

module.exports = { getLogs };
