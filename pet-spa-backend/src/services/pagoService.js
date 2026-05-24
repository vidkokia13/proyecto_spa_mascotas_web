'use strict';

const pagoRepo      = require('../repositories/pagoRepository');
const citaRepo      = require('../repositories/citaRepository');
const promocionRepo = require('../repositories/promocionRepository');
const auditService  = require('./auditService');
const AppError      = require('../utils/AppError');

async function registrarPago({ idCita, monto, metodo, referencia = null, registradoPor,
  idPromocion = null, codigoPromocion = null, ipAddress = null }) {
  const cita = await citaRepo.findById(idCita);
  if (!cita) throw new AppError('Cita no encontrada.', 404, 'CITA_NOT_FOUND');
  if (cita.estado === 'cancelada') throw new AppError('No se puede cobrar una cita cancelada.', 409, 'INVALID_STATE');

  let descuento   = 0;
  let promoId     = idPromocion || null;

  // Resolver código de promoción
  if (codigoPromocion && !promoId) {
    const promo = await promocionRepo.findByCodigo(codigoPromocion);
    if (!promo) throw new AppError('Código de promoción inválido o expirado.', 404, 'PROMO_INVALID');
    promoId   = promo.id_promocion;
    descuento = promo.tipo === 'porcentaje'
      ? Math.round(monto * promo.valor / 100 * 100) / 100
      : Math.min(parseFloat(promo.valor), monto);
  } else if (promoId) {
    const promo = await promocionRepo.findById(promoId);
    if (promo) {
      descuento = promo.tipo === 'porcentaje'
        ? Math.round(monto * promo.valor / 100 * 100) / 100
        : Math.min(parseFloat(promo.valor), monto);
    }
  }

  const pago = await pagoRepo.create({ idCita, monto, metodo, referencia, registradoPor, idPromocion: promoId, descuento });
  await auditService.log({
    idUsuario: registradoPor, accion: 'PAGO_REGISTRADO',
    detalle: `Cita ${idCita} — ${metodo} S/${monto}${descuento > 0 ? ` (desc S/${descuento})` : ''}`,
    ipAddress,
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

async function getRecibo(idCita) {
  const [resumen, pagos] = await Promise.all([
    pagoRepo.reciboByCita(idCita),
    pagoRepo.findByCita(idCita),
  ]);
  if (!resumen) throw new AppError('Cita no encontrada.', 404, 'CITA_NOT_FOUND');
  return {
    ...resumen,
    pagos,
    emitido_en: new Date().toISOString(),
  };
}

module.exports = { registrarPago, getPagosByCita, eliminarPago, getRecibo };
