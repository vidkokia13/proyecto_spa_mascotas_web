'use strict';

const pagoRepo = require('../repositories/pagoRepository');
const citaRepo = require('../repositories/citaRepository');
const auditService = require('./auditService');
const AppError = require('../utils/AppError');

async function registrarPago({ idCita, monto, metodo, referencia = null, registradoPor, ipAddress = null }) {
  const cita = await citaRepo.findById(idCita);
  if (!cita) throw new AppError('Cita no encontrada.', 404, 'CITA_NOT_FOUND');
  if (cita.estado === 'cancelada') throw new AppError('No se puede cobrar una cita cancelada.', 409, 'INVALID_STATE');

  const pago = await pagoRepo.create({ idCita, monto, metodo, referencia, registradoPor });
  await auditService.log({
    idUsuario: registradoPor, accion: 'PAGO_REGISTRADO',
    detalle: `Cita ${idCita} — ${metodo} S/${monto}`, ipAddress,
  });
  return pago;
}

async function getPagosByCita(idCita) {
  const cita = await citaRepo.findById(idCita);
  if (!cita) throw new AppError('Cita no encontrada.', 404, 'CITA_NOT_FOUND');
  const [pagos, total] = await Promise.all([
    pagoRepo.findByCita(idCita),
    pagoRepo.totalByCita(idCita),
  ]);
  return { pagos, total };
}

async function eliminarPago(idPago, idUsuario, ipAddress = null) {
  const pago = await pagoRepo.findById(idPago);
  if (!pago) throw new AppError('Pago no encontrado.', 404, 'PAGO_NOT_FOUND');
  await pagoRepo.remove(idPago);
  await auditService.log({ idUsuario, accion: 'PAGO_ELIMINADO', detalle: `Pago ${idPago}`, ipAddress });
}

module.exports = { registrarPago, getPagosByCita, eliminarPago };
