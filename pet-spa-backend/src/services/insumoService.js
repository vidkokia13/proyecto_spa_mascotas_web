'use strict';

const { withTransaction } = require('../config/db');
const insumoRepo          = require('../repositories/insumoRepository');
const citaRepo            = require('../repositories/citaRepository');
const AppError            = require('../utils/AppError');

async function getInsumos({ soloActivos = true } = {}) {
  return insumoRepo.findAll({ soloActivos });
}

async function createInsumo({ nombre, unidad, stock, stockMinimo }) {
  return insumoRepo.create({ nombre, unidad, stock, stockMinimo });
}

async function getBajoStock() {
  return insumoRepo.findBajoStock();
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

async function getLog({ idTrabajador = null, fecha = null } = {}) {
  return insumoRepo.findLog({ idTrabajador, fecha });
}

const SERVICIOS_CRITICOS  = 5;   // alert if stock covers fewer than this many services
const DESPERDICIO_UMBRAL  = 0.30; // alert if waste > 30% of received

async function getPrediccion() {
  const rows = await insumoRepo.findPrediccion();
  return rows.map(r => {
    const stock         = parseFloat(r.stock);
    const promedio      = parseFloat(r.promedio_uso);
    const totalRecibido = parseFloat(r.total_recibido);
    const desperdicio   = parseFloat(r.total_desperdicio);

    const serviciosRestantes = promedio > 0 ? Math.floor(stock / promedio) : null;
    const pctDesperdicio     = totalRecibido > 0 ? desperdicio / totalRecibido : 0;

    const alertas = [];
    if (r.num_servicios > 0 && serviciosRestantes !== null && serviciosRestantes < SERVICIOS_CRITICOS) {
      alertas.push({ tipo: 'stock_critico', mensaje: `Stock estimado para solo ${serviciosRestantes} servicio(s) más.` });
    }
    if (r.num_servicios > 0 && pctDesperdicio > DESPERDICIO_UMBRAL) {
      alertas.push({ tipo: 'consumo_elevado', mensaje: `Desperdicio alto: ${Math.round(pctDesperdicio * 100)}% de lo recibido.` });
    }

    return {
      id_insumo:          r.id_insumo,
      nombre:             r.nombre,
      unidad:             r.unidad,
      stock:              stock,
      stock_minimo:       r.stock_minimo,
      num_servicios:      r.num_servicios,
      promedio_uso:       promedio,
      servicios_restantes: serviciosRestantes,
      pct_desperdicio:    Math.round(pctDesperdicio * 100),
      alertas,
    };
  });
}

module.exports = { getInsumos, createInsumo, updateInsumo, getBajoStock, getCitaInsumos, registrarInsumos, updateCitaInsumo, getLog, getPrediccion };
