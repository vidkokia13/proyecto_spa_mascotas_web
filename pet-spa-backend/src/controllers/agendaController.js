'use strict';

const agendaService  = require('../services/agendaService');
const mascotaRepo    = require('../repositories/mascotaRepository');
const servicioRepo   = require('../repositories/servicioRepository');
const bloqueoRepo    = require('../repositories/bloqueoRepository');
const citaRepo       = require('../repositories/citaRepository');
const workerRepo     = require('../repositories/workerRepository');
const auditService   = require('../services/auditService');
const AppError       = require('../utils/AppError');

async function getSlots(req, res) {
  const { fecha, idServicio, idMascota, idTrabajador = null } = req.query;

  const [mascota, servicio] = await Promise.all([
    mascotaRepo.findById(idMascota),
    servicioRepo.findById(idServicio),
  ]);
  if (!mascota) throw new AppError('Mascota no encontrada.', 404, 'MASCOTA_NOT_FOUND');
  if (!servicio || !servicio.activo) throw new AppError('Servicio no encontrado.', 404, 'SERVICIO_NOT_FOUND');

  // Clients can only query their own pets
  if (req.user.rol === 'cliente' && mascota.id_usuario !== req.user.id_usuario) {
    throw new AppError('No tienes acceso a esta mascota.', 403, 'FORBIDDEN');
  }

  const result = await agendaService.getSlotsDisponibles({ fecha, servicio, mascota, idTrabajador: idTrabajador || null });
  res.json(result);
}

async function getBloqueos(req, res) {
  const { fechaInicio, fechaFin } = req.query;
  const bloqueos = (fechaInicio && fechaFin)
    ? await bloqueoRepo.findInRange(new Date(fechaInicio), new Date(fechaFin), null)
    : await bloqueoRepo.findAll();
  res.json({ bloqueos });
}

async function crearBloqueo(req, res) {
  const { tipo, fechaInicio, fechaFin, motivo, idTrabajador } = req.body;
  const bloqueo = await bloqueoRepo.create({ tipo, fechaInicio, fechaFin, motivo, idTrabajador, creadoPor: req.user.id_usuario });
  await auditService.log({ idUsuario: req.user.id_usuario, accion: 'BLOQUEO_CREADO', detalle: `Bloqueo ${bloqueo.id_bloqueo} tipo ${tipo}`, ipAddress: req.ip });
  res.status(201).json({ bloqueo });
}

async function eliminarBloqueo(req, res) {
  const bloqueo = await bloqueoRepo.findById(req.params.id);
  if (!bloqueo) throw new AppError('Bloqueo no encontrado.', 404, 'BLOQUEO_NOT_FOUND');
  await bloqueoRepo.remove(req.params.id);
  await auditService.log({ idUsuario: req.user.id_usuario, accion: 'BLOQUEO_ELIMINADO', detalle: `Bloqueo ${req.params.id}`, ipAddress: req.ip });
  res.json({ message: 'Bloqueo eliminado.' });
}

async function getGroomers(req, res) {
  const groomers = await workerRepo.findActiveGroomers();
  res.json({ groomers });
}

module.exports = { getSlots, getBloqueos, crearBloqueo, eliminarBloqueo, getGroomers };
