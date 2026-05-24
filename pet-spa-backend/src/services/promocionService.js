'use strict';

const promocionRepo = require('../repositories/promocionRepository');
const auditService  = require('./auditService');
const AppError      = require('../utils/AppError');

async function listPromociones(soloActivas = false) {
  return promocionRepo.findAll({ soloActivas });
}

async function getPromocion(idPromocion) {
  const p = await promocionRepo.findById(idPromocion);
  if (!p) throw new AppError('Promoción no encontrada.', 404, 'PROMO_NOT_FOUND');
  return p;
}

async function verificarCodigo(codigo, montoBase) {
  const promo = await promocionRepo.findByCodigo(codigo);
  if (!promo) throw new AppError('Código de promoción inválido o expirado.', 404, 'PROMO_INVALID');

  const descuento = promo.tipo === 'porcentaje'
    ? Math.round(montoBase * promo.valor / 100 * 100) / 100
    : Math.min(parseFloat(promo.valor), montoBase);

  return {
    promocion:  promo,
    montoBase,
    descuento,
    montoFinal: Math.max(0, montoBase - descuento),
  };
}

async function createPromocion(data, idUsuario, ipAddress = null) {
  const promo = await promocionRepo.create({ ...data, creadoPor: idUsuario });
  await auditService.log({ idUsuario, accion: 'PROMO_CREADA', detalle: promo.nombre, ipAddress });
  return promo;
}

async function updatePromocion(idPromocion, data, idUsuario, ipAddress = null) {
  const existing = await promocionRepo.findById(idPromocion);
  if (!existing) throw new AppError('Promoción no encontrada.', 404, 'PROMO_NOT_FOUND');
  const updated = await promocionRepo.update(idPromocion, data);
  await auditService.log({ idUsuario, accion: 'PROMO_ACTUALIZADA', detalle: idPromocion, ipAddress });
  return updated;
}

async function removePromocion(idPromocion, idUsuario, ipAddress = null) {
  const existing = await promocionRepo.findById(idPromocion);
  if (!existing) throw new AppError('Promoción no encontrada.', 404, 'PROMO_NOT_FOUND');
  await promocionRepo.remove(idPromocion);
  await auditService.log({ idUsuario, accion: 'PROMO_DESACTIVADA', detalle: idPromocion, ipAddress });
}

module.exports = { listPromociones, getPromocion, verificarCodigo, createPromocion, updatePromocion, removePromocion };
