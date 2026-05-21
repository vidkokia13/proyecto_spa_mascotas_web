'use strict';

const path      = require('path');
const fotoRepo  = require('../repositories/fotoRepository');
const citaRepo  = require('../repositories/citaRepository');
const AppError  = require('../utils/AppError');

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

async function getFotos(idCita) {
  const cita = await citaRepo.findById(idCita);
  if (!cita) throw new AppError('Cita no encontrada.', 404, 'CITA_NOT_FOUND');
  return fotoRepo.findByCita(idCita);
}

async function uploadFoto({ idCita, tipo, filename, idUsuario, rol }) {
  const cita = await citaRepo.findById(idCita);
  if (!cita) throw new AppError('Cita no encontrada.', 404, 'CITA_NOT_FOUND');
  if (rol === 'trabajador' && cita.id_trabajador !== idUsuario) {
    throw new AppError('Solo puedes subir fotos de tus propias citas.', 403, 'FORBIDDEN');
  }

  const url = `${BASE_URL}/uploads/citas/${filename}`;
  return fotoRepo.create({ idCita, tipo, url, subidoPor: idUsuario });
}

async function deleteFoto(idFoto, idUsuario, rol) {
  const foto = await fotoRepo.findById(idFoto);
  if (!foto) throw new AppError('Foto no encontrada.', 404, 'FOTO_NOT_FOUND');

  if (rol === 'trabajador' && foto.subido_por !== idUsuario) {
    throw new AppError('No puedes eliminar fotos de otros usuarios.', 403, 'FORBIDDEN');
  }

  await fotoRepo.remove(idFoto);
}

module.exports = { getFotos, uploadFoto, deleteFoto };
