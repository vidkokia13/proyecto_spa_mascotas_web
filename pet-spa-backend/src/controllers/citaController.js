'use strict';

const citaService = require('../services/citaService');

async function crear(req, res) {
  const { id_usuario: idUsuario, rol } = req.user;
  // Staff can book on behalf of a client
  const idUsuarioCliente = (['admin','jefe','recepcion'].includes(rol) && req.body.idUsuarioCliente)
    ? req.body.idUsuarioCliente
    : idUsuario;

  const cita = await citaService.crearCita({
    idUsuarioCliente,
    idMascota:       req.body.idMascota,
    idServicio:      req.body.idServicio,
    idTrabajador:    req.body.idTrabajador || null,
    fechaHoraInicio: req.body.fechaHoraInicio,
    notas:           req.body.notas || null,
    creadoPor:       idUsuario,
    ipAddress:       req.ip,
  });
  res.status(201).json({ cita });
}

async function getOne(req, res) {
  const cita = await citaService.getCita(req.params.id, req.user.id_usuario, req.user.rol);
  res.json({ cita });
}

async function misCitas(req, res) {
  const limit  = Math.min(parseInt(req.query.limit  || '20'), 100);
  const offset = parseInt(req.query.offset || '0');
  const citas  = await citaService.getMisCitas(req.user.id_usuario, { limit, offset });
  res.json({ citas, limit, offset });
}

async function listRango(req, res) {
  const { fechaInicio, fechaFin, idTrabajador, estado } = req.query;
  const citas = await citaService.getCitasRango({
    fechaInicio: new Date(fechaInicio),
    fechaFin:    new Date(fechaFin),
    idTrabajador: idTrabajador || null,
    estado:       estado || null,
  });
  res.json({ citas });
}

async function cambiarEstado(req, res) {
  const updated = await citaService.cambiarEstado(
    req.params.id, req.body.estado, req.user.id_usuario, req.user.id_trabajador, req.user.rol, req.ip,
  );
  res.json({ cita: updated });
}

async function actualizar(req, res) {
  const updated = await citaService.actualizarCita(
    req.params.id, req.body, req.user.id_usuario, req.user.rol, req.ip,
  );
  res.json({ cita: updated });
}

async function reprogramar(req, res) {
  const updated = await citaService.reprogramarCita(
    req.params.id, req.body, req.user.id_usuario, req.user.rol, req.ip,
  );
  res.json({ cita: updated });
}

async function cancelarPorCliente(req, res) {
  const updated = await citaService.cancelarCitaPorCliente(
    req.params.id, req.body, req.user.id_usuario, req.ip,
  );
  res.json({ cita: updated });
}

async function calendario(req, res) {
  const { fecha, rango } = req.query;
  const data = await citaService.getCalendario({
    fecha: fecha || new Date().toISOString().slice(0, 10),
    rango: rango || 'dia',
  });
  res.json(data);
}

async function miAgenda(req, res) {
  const { fechaInicio, fechaFin } = req.query;
  const citas = await citaService.getMiAgenda(req.user.id_usuario, { fechaInicio, fechaFin });
  res.json({ citas });
}

async function cerrarServicio(req, res) {
  const updated = await citaService.cerrarServicio(
    req.params.id, req.user.id_usuario, req.user.id_trabajador, req.user.rol, req.ip,
  );
  res.json({ cita: updated });
}

module.exports = { crear, getOne, misCitas, listRango, cambiarEstado, actualizar, reprogramar, cancelarPorCliente, calendario, miAgenda, cerrarServicio };
