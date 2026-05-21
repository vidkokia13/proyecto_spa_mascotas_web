'use strict';

const pagoService = require('../services/pagoService');

async function registrar(req, res) {
  const { id: idUsuario, rol } = req.user;
  const { idCita, monto, metodo, referencia } = req.body;
  const pago = await pagoService.registrarPago({
    idCita, monto, metodo, referencia, registradoPor: idUsuario, ipAddress: req.ip,
  });
  res.status(201).json({ pago });
}

async function listByCita(req, res) {
  const { idCita } = req.params;
  const result = await pagoService.getPagosByCita(idCita);
  res.json(result);
}

async function eliminar(req, res) {
  await pagoService.eliminarPago(req.params.id, req.user.id, req.ip);
  res.json({ message: 'Pago eliminado.' });
}

module.exports = { registrar, listByCita, eliminar };
