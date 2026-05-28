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
    metodos[row.metodo]  = parseFloat(row.total);
    totalGeneral        += parseFloat(row.total);
    totalDescuentos     += parseFloat(row.total_descuentos);
    numPagos            += row.cantidad;
  }

  return { metodos, totalGeneral, totalDescuentos, numPagos };
}

async function getResumen(fecha) {
  const { totales, pagos, num_citas } = await cajaRepo.resumenDiario(fecha);
  const { totalGeneral, totalDescuentos, numPagos } = _buildTotales(totales);
  const cierre = await cajaRepo.findCierre(fecha);

  return {
    fecha,
    ya_cerrada:       !!cierre,
    cierre:           cierre || null,
    por_metodo:       totales,
    total_general:    totalGeneral,
    total_descuentos: totalDescuentos,
    num_pagos:        numPagos,
    num_citas,
    pagos,
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

async function reabrirCaja(fecha, idUsuario, ipAddress = null) {
  const existing = await cajaRepo.findCierre(fecha);
  if (!existing) {
    throw new AppError(`La caja del ${fecha} no está cerrada.`, 409, 'CAJA_NOT_CLOSED');
  }

  await cajaRepo.deleteCierre(fecha);

  await auditService.log({
    idUsuario, accion: 'CAJA_REABIERTA',
    detalle: `Caja ${fecha} reabierta`,
    ipAddress,
  });
}

async function listHistorial({ limit = 30, offset = 0 } = {}) {
  return cajaRepo.listCierres({ limit, offset });
}

module.exports = { getResumen, cerrarCaja, reabrirCaja, listHistorial };
