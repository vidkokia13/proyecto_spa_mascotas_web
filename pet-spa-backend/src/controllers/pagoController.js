'use strict';

const pagoService = require('../services/pagoService');

async function registrar(req, res) {
  const { idCita, monto, metodo, referencia, idPromocion, codigoPromocion } = req.body;
  const pago = await pagoService.registrarPago({
    idCita, monto, metodo, referencia,
    idPromocion: idPromocion || null,
    codigoPromocion: codigoPromocion || null,
    registradoPor: req.user.id, ipAddress: req.ip,
  });
  res.status(201).json({ pago });
}

async function listByCita(req, res) {
  const result = await pagoService.getPagosByCita(req.params.idCita);
  res.json(result);
}

async function recibo(req, res) {
  const data = await pagoService.getRecibo(req.params.idCita);
  res.json({ recibo: data });
}

async function eliminar(req, res) {
  await pagoService.eliminarPago(req.params.id, req.user.id, req.ip);
  res.json({ message: 'Pago eliminado.' });
}

module.exports = { registrar, listByCita, recibo, eliminar };
