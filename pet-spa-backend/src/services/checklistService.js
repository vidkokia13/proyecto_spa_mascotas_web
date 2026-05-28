'use strict';

const checklistRepo = require('../repositories/checklistRepository');
const citaRepo      = require('../repositories/citaRepository');
const AppError      = require('../utils/AppError');

async function getItems(query = {}) {
  return checklistRepo.findItems(query);
}

async function createItem({ idServicio = null, descripcion, orden = 0 }) {
  return checklistRepo.createItem({ idServicio, descripcion, orden });
}

async function updateItem(idItem, fields) {
  const item = await checklistRepo.updateItem(idItem, fields);
  if (!item) throw new AppError('Item no encontrado.', 404, 'ITEM_NOT_FOUND');
  return item;
}

async function getCitaChecklist(idCita) {
  const cita = await citaRepo.findById(idCita);
  if (!cita) throw new AppError('Cita no encontrada.', 404, 'CITA_NOT_FOUND');

  let items = await checklistRepo.findCitaChecklist(idCita);
  // Auto-init if empty
  if (items.length === 0) {
    await checklistRepo.initCitaChecklist(idCita, cita.id_servicio);
    items = await checklistRepo.findCitaChecklist(idCita);
  }
  return items;
}

async function toggleItem(idCita, idItem, completado, idTrabajador, rol) {
  const cita = await citaRepo.findById(idCita);
  if (!cita) throw new AppError('Cita no encontrada.', 404, 'CITA_NOT_FOUND');
  if (rol === 'trabajador' && cita.id_trabajador && cita.id_trabajador !== idTrabajador) {
    throw new AppError('Solo puedes modificar el checklist de tus propias citas.', 403, 'FORBIDDEN');
  }
  const row = await checklistRepo.toggleItem(idCita, idItem, completado);
  if (!row) throw new AppError('Item no encontrado en esta cita.', 404, 'ITEM_NOT_FOUND');
  return row;
}

module.exports = { getItems, createItem, updateItem, getCitaChecklist, toggleItem };
