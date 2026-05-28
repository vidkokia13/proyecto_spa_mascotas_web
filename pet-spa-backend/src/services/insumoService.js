'use strict';

const { withTransaction } = require('../config/db');
const insumoRepo          = require('../repositories/insumoRepository');
const citaRepo            = require('../repositories/citaRepository');
const AppError            = require('../utils/AppError');

async function getInsumos({ soloActivos = true } = {}) {
  return insumoRepo.findAll({ soloActivos });
}

async function createInsumo({ nombre, unidad, stock }) {
  return insumoRepo.create({ nombre, unidad, stock });
}

async function updateInsumo(idInsumo, fields) {
  const insumo = await insumoRepo.update(idInsumo, fields);
  if (!insumo) throw new AppError('Insumo no encontrado.', 404, 'INSUMO_NOT_FOUND');
  return insumo;
}

async function getCitaInsumos(idCita) {
  const cita = await citaRepo.findById(idCita);
  if (!cita) throw new AppError('Cita no encontrada.', 404, 'CITA_NOT_FOUND');
  return insumoRepo.findByCita(idCita);
}

async function registrarInsumos({ idCita, idUsuario, idTrabajador, rol, insumos }) {
  const cita = await citaRepo.findById(idCita);
  if (!cita) throw new AppError('Cita no encontrada.', 404, 'CITA_NOT_FOUND');
  if (rol === 'trabajador' && cita.id_trabajador && cita.id_trabajador !== idTrabajador) {
    throw new AppError('Solo puedes registrar insumos de tus propias citas.', 403, 'FORBIDDEN');
  }

  return withTransaction(async (client) => {
    const results = [];
    for (const item of insumos) {
      const insumo = await insumoRepo.findById(item.idInsumo, client);
      if (!insumo) throw new AppError(`Insumo ${item.idInsumo} no encontrado.`, 404, 'INSUMO_NOT_FOUND');

      // Descuenta del stock: lo entregado al groomer menos lo devuelto
      const cantidadRecibida = item.cantidadRecibida ?? 0;
      const cantidadDevuelta = item.cantidadDevuelta ?? 0;
      const delta = cantidadDevuelta - cantidadRecibida;
      if (insumo.stock + delta < 0) {
        throw new AppError(`Stock insuficiente para "${insumo.nombre}".`, 409, 'INSUFFICIENT_STOCK');
      }
      await insumoRepo.adjustStock(item.idInsumo, delta, client);

      const reg = await insumoRepo.createCitaInsumo({
        idCita,
        idInsumo:         item.idInsumo,
        cantidadRecibida: item.cantidadRecibida ?? 0,
        cantidadUsada:    item.cantidadUsada    ?? 0,
        cantidadDevuelta: item.cantidadDevuelta ?? 0,
        desperdicio:      item.desperdicio      ?? 0,
        registradoPor:    idUsuario,
      }, client);
      results.push(reg);
    }
    return results;
  });
}

async function updateCitaInsumo(idCitaInsumo, fields) {
  const reg = await insumoRepo.updateCitaInsumo(idCitaInsumo, fields);
  if (!reg) throw new AppError('Registro de insumo no encontrado.', 404, 'REGISTRO_NOT_FOUND');
  return reg;
}

module.exports = { getInsumos, createInsumo, updateInsumo, getCitaInsumos, registrarInsumos, updateCitaInsumo };
