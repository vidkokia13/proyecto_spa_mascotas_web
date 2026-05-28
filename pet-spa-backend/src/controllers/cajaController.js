'use strict';

const cajaService = require('../services/cajaService');

async function resumen(req, res) {
  const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);
  const data  = await cajaService.getResumen(fecha);
  res.json({ resumen: data });
}

async function cerrar(req, res) {
  const { fecha, notas } = req.body;
  const cierre = await cajaService.cerrarCaja(
    fecha || new Date().toISOString().slice(0, 10),
    notas || null,
    req.user.id_usuario,
    req.ip,
  );
  res.status(201).json({ cierre });
}

async function reabrir(req, res) {
  const { fecha } = req.body;
  await cajaService.reabrirCaja(
    fecha || new Date().toISOString().slice(0, 10),
    req.user.id_usuario,
    req.ip,
  );
  res.json({ message: 'Caja reabierta correctamente.' });
}

async function historial(req, res) {
  const limit  = Math.min(parseInt(req.query.limit  || '30'), 100);
  const offset = parseInt(req.query.offset || '0');
  const cierres = await cajaService.listHistorial({ limit, offset });
  res.json({ cierres, limit, offset });
}

module.exports = { resumen, cerrar, reabrir, historial };
