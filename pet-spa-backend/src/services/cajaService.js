'use strict';

const cajaRepo    = require('../repositories/cajaRepository');
const auditService = require('./auditService');
const AppError    = require('../utils/AppError');

function _buildTotales(totales) {
  const metodos = { efectivo: 0, qr: 0, transferencia: 0 };
  let totalGeneral = 0;
  let totalDescuentos = 0;
  let numPagos = 0;

  for (const row of totales) {
    metodos[row.metodo]  = parseFloat(row.total_neto);
    totalGeneral        += parseFloat(row.total_neto);
    totalDescuentos     += parseFloat(row.total_descuentos);
    numPagos            += row.num_pagos;
  }

  return { metodos, totalGeneral, totalDescuentos, numPagos };
}

async function getResumen(fecha) {
  const { totales, pagos, num_citas } = await cajaRepo.resumenDiario(fecha);
  const { metodos, totalGeneral, totalDescuentos, numPagos } = _buildTotales(totales);

  return {
    fecha,
    totalesPorMetodo: totales,
    efectivo:         metodos.efectivo,
    qr:               metodos.qr,
    transferencia:    metodos.transferencia,
    totalDescuentos,
    totalGeneral,
    numPagos,
    numCitas:         num_citas,
    pagos,
    cerrado:          false,
  };
}

async function cerrarCaja(fecha, notas, idUsuario, ipAddress = null) {
  const existing = await cajaRepo.findCierre(fecha);
  if (existing) {
    throw new AppError(`La caja del ${fecha} ya fue cerrada.`, 409, 'CAJA_ALREADY_CLOSED');
  }

  const { totales, num_citas } = await cajaRepo.resumenDiario(fecha);
  const { metodos, totalGeneral, totalDescuentos, numPagos } = _buildTotales(totales);

  const cierre = await cajaRepo.createCierre({
    fecha,
    totalEfectivo:      metodos.efectivo,
    totalQr:            metodos.qr,
    totalTransferencia: metodos.transferencia,
    totalGeneral,
    totalDescuentos,
    numPagos,
    numCitas: num_citas,
    cerradoPor: idUsuario,
    notas,
  });

  await auditService.log({
    idUsuario, accion: 'CAJA_CERRADA',
    detalle: `Caja ${fecha} — total S/${totalGeneral}`,
    ipAddress,
  });

  return cierre;
}

async function listHistorial({ limit = 30, offset = 0 } = {}) {
  return cajaRepo.listCierres({ limit, offset });
}

module.exports = { getResumen, cerrarCaja, listHistorial };
