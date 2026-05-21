'use strict';

const servicioRepo = require('../repositories/servicioRepository');
const AppError     = require('../utils/AppError');

async function listar(soloActivos = true) {
  return servicioRepo.findAll({ soloActivos });
}

async function getById(idServicio) {
  const s = await servicioRepo.findById(idServicio);
  if (!s) throw new AppError('Servicio no encontrado.', 404, 'SERVICIO_NOT_FOUND');
  return s;
}

async function crear(data) {
  return servicioRepo.create(data);
}

async function actualizar(idServicio, data) {
  const existing = await servicioRepo.findById(idServicio);
  if (!existing) throw new AppError('Servicio no encontrado.', 404, 'SERVICIO_NOT_FOUND');
  const updated = await servicioRepo.update(idServicio, data);
  return updated;
}

module.exports = { listar, getById, crear, actualizar };
