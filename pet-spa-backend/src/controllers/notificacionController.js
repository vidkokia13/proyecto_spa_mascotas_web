'use strict';

const notifRepo = require('../repositories/notificacionRepository');

async function listar(req, res) {
  const { tipo, fecha } = req.query;
  const limit  = Math.min(parseInt(req.query.limit  || '50'), 200);
  const offset = parseInt(req.query.offset || '0');

  const [notificaciones, total] = await Promise.all([
    notifRepo.findAll({ tipo, fecha, limit, offset }),
    notifRepo.countAll({ tipo, fecha }),
  ]);

  res.json({ notificaciones, total, limit, offset });
}

async function stats(req, res) {
  const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);

  const [hoy, historico] = await Promise.all([
    notifRepo.statsPorTipo(fecha),
    notifRepo.totalHistorico(),
  ]);

  res.json({ fecha, hoy, historico });
}

module.exports = { listar, stats };
