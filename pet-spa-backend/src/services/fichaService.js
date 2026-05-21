'use strict';

const fichaRepo = require('../repositories/fichaRepository');
const citaRepo  = require('../repositories/citaRepository');
const AppError  = require('../utils/AppError');

async function getFicha(idCita) {
  const cita = await citaRepo.findById(idCita);
  if (!cita) throw new AppError('Cita no encontrada.', 404, 'CITA_NOT_FOUND');
  return fichaRepo.findByCita(idCita);
}

async function saveFicha({ idCita, estadoPelaje, condicionPiel, observaciones, pesoActual, idUsuario, rol }) {
  const cita = await citaRepo.findById(idCita);
  if (!cita) throw new AppError('Cita no encontrada.', 404, 'CITA_NOT_FOUND');

  // Groomer can only edit their own assigned cita
  if (rol === 'trabajador' && cita.id_trabajador !== idUsuario) {
    throw new AppError('Solo puedes registrar fichas de tus propias citas.', 403, 'FORBIDDEN');
  }

  return fichaRepo.upsert({ idCita, estadoPelaje, condicionPiel, observaciones, pesoActual, creadoPor: idUsuario });
}

module.exports = { getFicha, saveFicha };
