'use strict';

const horarioService = require('../services/horarioService');

async function getHorarios(_req, res) {
  const horarios = await horarioService.getHorarios();
  res.json({ horarios });
}

async function setHorario(req, res) {
  const horario = await horarioService.setHorario(req.body);
  res.json({ horario });
}

async function toggleHorario(req, res) {
  const horario = await horarioService.toggleHorario(Number(req.params.dia), req.body.activo);
  res.json({ horario });
}

async function getDisponibilidadGroomer(req, res) {
  const disp = await horarioService.getDisponibilidadGroomer(req.params.idTrabajador);
  res.json({ disponibilidad: disp });
}

async function setDisponibilidadGroomer(req, res) {
  const disp = await horarioService.setDisponibilidadGroomer(req.body);
  res.json({ disponibilidad: disp });
}

async function removeDisponibilidadGroomer(req, res) {
  await horarioService.removeDisponibilidadGroomer(req.params.idTrabajador, Number(req.params.dia));
  res.json({ message: 'Disponibilidad eliminada.' });
}

module.exports = { getHorarios, setHorario, toggleHorario, getDisponibilidadGroomer, setDisponibilidadGroomer, removeDisponibilidadGroomer };
