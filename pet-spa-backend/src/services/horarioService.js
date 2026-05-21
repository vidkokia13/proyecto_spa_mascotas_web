'use strict';

const horarioRepo       = require('../repositories/horarioRepository');
const disponibilidadRepo = require('../repositories/disponibilidadRepository');
const AppError          = require('../utils/AppError');

async function getHorarios() {
  return horarioRepo.findAll();
}

async function setHorario({ diaSemana, horaInicio, horaFin, capacidadMax }) {
  if (diaSemana < 0 || diaSemana > 6) throw new AppError('Día inválido (0-6).', 400, 'VALIDATION_ERROR');
  return horarioRepo.upsert({ diaSemana, horaInicio, horaFin, capacidadMax });
}

async function toggleHorario(diaSemana, activo) {
  const h = await horarioRepo.setActivo(diaSemana, activo);
  if (!h) throw new AppError('Horario no encontrado.', 404, 'HORARIO_NOT_FOUND');
  return h;
}

async function getDisponibilidadGroomer(idTrabajador) {
  return disponibilidadRepo.findByTrabajador(idTrabajador);
}

async function setDisponibilidadGroomer({ idTrabajador, diaSemana, horaInicio, horaFin }) {
  if (diaSemana < 0 || diaSemana > 6) throw new AppError('Día inválido (0-6).', 400, 'VALIDATION_ERROR');
  return disponibilidadRepo.upsert({ idTrabajador, diaSemana, horaInicio, horaFin });
}

async function removeDisponibilidadGroomer(idTrabajador, diaSemana) {
  await disponibilidadRepo.remove(idTrabajador, diaSemana);
}

module.exports = { getHorarios, setHorario, toggleHorario, getDisponibilidadGroomer, setDisponibilidadGroomer, removeDisponibilidadGroomer };
