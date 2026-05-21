'use strict';

const mascotaRepo = require('../repositories/mascotaRepository');
const clientRepo  = require('../repositories/clientRepository');
const AppError    = require('../utils/AppError');

async function _requireClienteId(idUsuario) {
  const cliente = await clientRepo.findByUserId(idUsuario);
  if (!cliente) throw new AppError('Perfil de cliente no encontrado.', 404, 'CLIENT_NOT_FOUND');
  return cliente.id_cliente;
}

async function getMisMascotas(idUsuario) {
  return mascotaRepo.findByUserId(idUsuario);
}

async function getMascota(idMascota, idUsuario, rol) {
  const mascota = await mascotaRepo.findById(idMascota);
  if (!mascota) throw new AppError('Mascota no encontrada.', 404, 'MASCOTA_NOT_FOUND');
  if (rol === 'cliente' && mascota.id_usuario !== idUsuario) {
    throw new AppError('No tienes acceso a esta mascota.', 403, 'FORBIDDEN');
  }
  return mascota;
}

async function createMascota(idUsuario, data) {
  const idCliente = await _requireClienteId(idUsuario);
  return mascotaRepo.create({ ...data, idCliente });
}

async function updateMascota(idMascota, idUsuario, rol, data) {
  const mascota = await mascotaRepo.findById(idMascota);
  if (!mascota) throw new AppError('Mascota no encontrada.', 404, 'MASCOTA_NOT_FOUND');
  if (rol === 'cliente' && mascota.id_usuario !== idUsuario) {
    throw new AppError('No tienes acceso a esta mascota.', 403, 'FORBIDDEN');
  }
  return mascotaRepo.update(idMascota, data);
}

async function deleteMascota(idMascota, idUsuario, rol) {
  const mascota = await mascotaRepo.findById(idMascota);
  if (!mascota) throw new AppError('Mascota no encontrada.', 404, 'MASCOTA_NOT_FOUND');
  if (rol === 'cliente' && mascota.id_usuario !== idUsuario) {
    throw new AppError('No tienes acceso a esta mascota.', 403, 'FORBIDDEN');
  }
  await mascotaRepo.remove(idMascota);
}

module.exports = { getMisMascotas, getMascota, createMascota, updateMascota, deleteMascota };
