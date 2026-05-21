'use strict';

const { withTransaction } = require('../config/db');
const citaRepo            = require('../repositories/citaRepository');
const mascotaRepo         = require('../repositories/mascotaRepository');
const servicioRepo        = require('../repositories/servicioRepository');
const horarioRepo         = require('../repositories/horarioRepository');
const bloqueoRepo         = require('../repositories/bloqueoRepository');
const disponibilidadRepo  = require('../repositories/disponibilidadRepository');
const clientRepo          = require('../repositories/clientRepository');
const { calcularDuracion } = require('./agendaService');
const auditService        = require('./auditService');
const AppError            = require('../utils/AppError');

function _timeToMin(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

async function _validarSlot({ fecha, diaSemana, slotMin, slotFinMin, idTrabajador, capacidadMax, client, excludeId = null }) {
  const pad = (n) => String(n).padStart(2, '0');
  const slotHora  = `${pad(Math.floor(slotMin  / 60))}:${pad(slotMin  % 60)}`;
  const slotFinH  = `${pad(Math.floor(slotFinMin / 60))}:${pad(slotFinMin % 60)}`;
  const slotInicio = new Date(`${fecha}T${slotHora}:00`);
  const slotFin    = new Date(`${fecha}T${slotFinH}:00`);

  const bloqueos = await bloqueoRepo.findInRange(slotInicio, slotFin, null, client);
  if (bloqueos.length > 0) throw new AppError('El spa tiene un bloqueo en ese horario.', 409, 'SLOT_BLOCKED');

  const ocupadas = await citaRepo.countSpaOverlaps(slotInicio, slotFin, excludeId, client);
  if (ocupadas >= capacidadMax) throw new AppError('Capacidad máxima del spa alcanzada.', 409, 'CAPACITY_FULL');

  if (idTrabajador) {
    const disp = await disponibilidadRepo.findByTrabajador(idTrabajador, client);
    const cubre = disp.some(d =>
      d.dia_semana === diaSemana &&
      _timeToMin(d.hora_inicio) <= slotMin &&
      _timeToMin(d.hora_fin)    >= slotFinMin,
    );
    if (!cubre) throw new AppError('El groomer no está disponible ese día/hora.', 409, 'GROOMER_UNAVAILABLE');

    const bloqueosG = await bloqueoRepo.findInRange(slotInicio, slotFin, idTrabajador, client);
    if (bloqueosG.length > 0) throw new AppError('El groomer tiene un bloqueo en ese horario.', 409, 'GROOMER_BLOCKED');

    const overlap = await citaRepo.countOverlaps(idTrabajador, slotInicio, slotFin, excludeId, client);
    if (overlap > 0) throw new AppError('El groomer ya tiene una cita en ese horario.', 409, 'GROOMER_OVERLAP');
  }

  return { slotInicio, slotFin };
}

async function crearCita({ idUsuarioCliente, idMascota, idServicio, idTrabajador = null,
  fechaHoraInicio, notas = null, creadoPor, ipAddress = null }) {

  return withTransaction(async (client) => {
    const [mascota, servicio, cliente] = await Promise.all([
      mascotaRepo.findById(idMascota, client),
      servicioRepo.findById(idServicio, client),
      clientRepo.findByUserId(idUsuarioCliente, client),
    ]);

    if (!mascota)   throw new AppError('Mascota no encontrada.', 404, 'MASCOTA_NOT_FOUND');
    if (!servicio || !servicio.activo) throw new AppError('Servicio no disponible.', 404, 'SERVICIO_NOT_FOUND');
    if (!cliente)   throw new AppError('Perfil de cliente no encontrado.', 404, 'CLIENT_NOT_FOUND');

    // Verify pet belongs to client
    if (mascota.id_cliente !== cliente.id_cliente) {
      throw new AppError('La mascota no pertenece a este cliente.', 403, 'FORBIDDEN');
    }

    const duracion   = calcularDuracion(servicio.duracion_base, mascota.tamano, mascota.temperamento, mascota.tiempo_extra_min);
    const inicio     = new Date(fechaHoraInicio);
    const fecha      = inicio.toISOString().slice(0, 10);
    const diaSemana  = inicio.getDay();

    const horario = await horarioRepo.findByDia(diaSemana, client);
    if (!horario || !horario.activo) throw new AppError('El spa no atiende ese día.', 409, 'SPA_CLOSED');

    const slotMin    = inicio.getHours() * 60 + inicio.getMinutes();
    const slotFinMin = slotMin + duracion;
    const [hFin, mFin] = horario.hora_fin.split(':').map(Number);
    if (slotFinMin > hFin * 60 + mFin) {
      throw new AppError('La cita terminaría después del cierre del spa.', 409, 'SLOT_OVERFLOW');
    }

    const { slotInicio, slotFin } = await _validarSlot({
      fecha, diaSemana, slotMin, slotFinMin, idTrabajador,
      capacidadMax: horario.capacidad_max, client,
    });

    const cita = await citaRepo.create({
      idCliente: cliente.id_cliente, idMascota, idServicio, idTrabajador,
      fechaHoraInicio: slotInicio,
      fechaHoraFin:    slotFin,
      duracionAjustada: duracion,
      notas, creadoPor,
    }, client);

    await auditService.log({
      idUsuario: creadoPor, accion: 'CITA_CREADA',
      detalle: `Cita ${cita.id_cita} cliente=${idUsuarioCliente} mascota=${idMascota} servicio=${idServicio}`,
      ipAddress,
    }, client);

    return cita;
  });
}

async function getCita(idCita, idUsuario, rol) {
  const cita = await citaRepo.findById(idCita);
  if (!cita) throw new AppError('Cita no encontrada.', 404, 'CITA_NOT_FOUND');
  if (rol === 'cliente' && cita.id_usuario_cliente !== idUsuario) {
    throw new AppError('No tienes acceso a esta cita.', 403, 'FORBIDDEN');
  }
  return cita;
}

async function getMisCitas(idUsuario, opts = {}) {
  return citaRepo.findByCliente(idUsuario, opts);
}

async function getCitasRango({ fechaInicio, fechaFin, idTrabajador = null, estado = null }) {
  return citaRepo.findInRange(fechaInicio, fechaFin, { idTrabajador, estado });
}

async function cambiarEstado(idCita, estado, idUsuario, rol, ipAddress = null) {
  const cita = await citaRepo.findById(idCita);
  if (!cita) throw new AppError('Cita no encontrada.', 404, 'CITA_NOT_FOUND');

  const TRANSITIONS = {
    cliente:    { pendiente: ['cancelada'] },
    trabajador: { pendiente: ['confirmada','en_proceso','cancelada'], confirmada: ['en_proceso','cancelada'], en_proceso: ['completada'] },
    recepcion:  { pendiente: ['confirmada','cancelada'], confirmada: ['cancelada'] },
    jefe:       { pendiente: ['confirmada','cancelada'], confirmada: ['en_proceso','cancelada'], en_proceso: ['completada'], completada: [], cancelada: [] },
    admin:      { pendiente: ['confirmada','cancelada'], confirmada: ['en_proceso','cancelada'], en_proceso: ['completada'], completada: [], cancelada: [] },
  };

  const allowed = TRANSITIONS[rol]?.[cita.estado] ?? [];
  if (!allowed.includes(estado)) {
    throw new AppError(`Transición no permitida: ${cita.estado} → ${estado}.`, 409, 'INVALID_TRANSITION');
  }

  if (rol === 'cliente' && cita.id_usuario_cliente !== idUsuario) {
    throw new AppError('No tienes acceso a esta cita.', 403, 'FORBIDDEN');
  }

  const updated = await citaRepo.updateEstado(idCita, estado);
  await auditService.log({ idUsuario, accion: 'CITA_ESTADO_CAMBIADO', detalle: `Cita ${idCita}: ${cita.estado} → ${estado}`, ipAddress });
  return updated;
}

async function actualizarCita(idCita, fields, idUsuario, rol, ipAddress = null) {
  const cita = await citaRepo.findById(idCita);
  if (!cita) throw new AppError('Cita no encontrada.', 404, 'CITA_NOT_FOUND');
  if (!['admin','jefe','recepcion'].includes(rol)) throw new AppError('Sin permisos.', 403, 'FORBIDDEN');
  if (!['pendiente','confirmada'].includes(cita.estado)) {
    throw new AppError('Solo se pueden modificar citas pendientes o confirmadas.', 409, 'INVALID_STATE');
  }
  const updated = await citaRepo.update(idCita, fields);
  await auditService.log({ idUsuario, accion: 'CITA_ACTUALIZADA', detalle: `Cita ${idCita} actualizada`, ipAddress });
  return updated;
}

module.exports = { crearCita, getCita, getMisCitas, getCitasRango, cambiarEstado, actualizarCita };
