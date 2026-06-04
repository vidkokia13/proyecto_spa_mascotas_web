'use strict';

const repo     = require('../repositories/reporteRepository');
const AppError = require('../utils/AppError');

// ── helpers ───────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}
function mesInicio() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

async function ventas(req, res) {
  const inicio = req.query.fecha_inicio || mesInicio();
  const fin    = req.query.fecha_fin    || today();
  const data   = await repo.ventasPorPeriodo(inicio, fin);
  res.json({ periodo: { inicio, fin }, ...data });
}

async function ocupacion(req, res) {
  const inicio = req.query.fecha_inicio || mesInicio();
  const fin    = req.query.fecha_fin    || today();
  const data   = await repo.ocupacionGlobal(inicio, fin);
  res.json({ periodo: { inicio, fin }, ...data });
}

async function nps(req, res) {
  const inicio = req.query.fecha_inicio || mesInicio();
  const fin    = req.query.fecha_fin    || today();
  const data   = await repo.reporteNps(inicio, fin);
  res.json({ periodo: { inicio, fin }, ...data });
}

// ── Recepción ─────────────────────────────────────────────────────────────────

async function cronograma(req, res) {
  const fecha = req.query.fecha || today();
  const citas = await repo.cronogramaDiario(fecha);
  res.json({ fecha, citas });
}

async function reporteCancelaciones(req, res) {
  const inicio = req.query.fecha_inicio || mesInicio();
  const fin    = req.query.fecha_fin    || today();
  const data   = await repo.cancelaciones(inicio, fin);
  res.json({ periodo: { inicio, fin }, ...data });
}

// ── Groomer ───────────────────────────────────────────────────────────────────

async function productividad(req, res) {
  const inicio       = req.query.fecha_inicio || mesInicio();
  const fin          = req.query.fecha_fin    || today();
  const { rol, id_usuario } = req.user;

  // Trabajador solo ve su propia productividad
  let idTrabajador = req.query.id_trabajador || null;
  if (rol === 'trabajador') {
    idTrabajador = await repo.getTrabajadorByUsuario(id_usuario);
    if (!idTrabajador) throw new AppError('Groomer no encontrado.', 404, 'NOT_FOUND');
  }

  const data = await repo.productividadGroomers(inicio, fin, idTrabajador);
  res.json({ periodo: { inicio, fin }, groomers: data });
}

async function misInsumos(req, res) {
  const inicio      = req.query.fecha_inicio || mesInicio();
  const fin         = req.query.fecha_fin    || today();
  const { id_usuario } = req.user;

  const idTrabajador = await repo.getTrabajadorByUsuario(id_usuario);
  if (!idTrabajador) throw new AppError('Groomer no encontrado.', 404, 'NOT_FOUND');

  const data = await repo.insumosGroomer(idTrabajador, inicio, fin);
  res.json({ periodo: { inicio, fin }, ...data });
}

// ── Cliente ───────────────────────────────────────────────────────────────────

async function historialClinico(req, res) {
  const { id_usuario } = req.user;
  const idMascota      = req.query.id_mascota || null;
  const data           = await repo.historialClinico(id_usuario, idMascota);
  res.json({ historial: data });
}

async function misPromociones(req, res) {
  const data = await repo.misPromociones(req.user.id_usuario);
  res.json(data);
}

// ── Calificaciones ────────────────────────────────────────────────────────────

async function crearCalificacion(req, res) {
  const { id_cita, puntuacion, comentario } = req.body;
  if (!id_cita || !puntuacion) {
    throw new AppError('id_cita y puntuacion son requeridos.', 400, 'VALIDATION_ERROR');
  }
  if (puntuacion < 1 || puntuacion > 5) {
    throw new AppError('La puntuación debe ser entre 1 y 5.', 400, 'VALIDATION_ERROR');
  }

  const cal = await repo.crearCalificacion({
    idCita:     id_cita,
    idUsuario:  req.user.id_usuario,
    puntuacion: parseInt(puntuacion, 10),
    comentario,
  });
  res.status(201).json({ calificacion: cal });
}

async function getCalificacion(req, res) {
  const cal = await repo.getCalificacionByCita(req.params.id);
  res.json({ calificacion: cal });
}

async function recomendaciones(req, res) {
  const idMascota = req.params.id;
  if (!idMascota) throw new AppError('id_mascota requerido.', 400, 'VALIDATION_ERROR');
  const data = await repo.recomendacionesProductos(idMascota);
  res.json(data);
}

module.exports = {
  ventas, ocupacion, nps,
  cronograma, reporteCancelaciones,
  productividad, misInsumos,
  historialClinico, misPromociones,
  crearCalificacion, getCalificacion,
  recomendaciones,
};
