'use strict';

const insumoService = require('../services/insumoService');

async function list(req, res) {
  const soloActivos = req.query.todos !== 'true';
  const insumos = await insumoService.getInsumos({ soloActivos });
  res.json({ insumos });
}

async function crear(req, res) {
  const insumo = await insumoService.createInsumo(req.body);
  res.status(201).json({ insumo });
}

async function actualizar(req, res) {
  const insumo = await insumoService.updateInsumo(req.params.id, req.body);
  res.json({ insumo });
}

async function listByCita(req, res) {
  const insumos = await insumoService.getCitaInsumos(req.params.idCita);
  res.json({ insumos });
}

async function registrar(req, res) {
  const { id_usuario: idUsuario, id_trabajador: idTrabajador, rol } = req.user;
  const { idCita, insumos } = req.body;
  const result = await insumoService.registrarInsumos({ idCita, idUsuario, idTrabajador, rol, insumos });
  res.status(201).json({ insumos: result });
}

async function alertas(req, res) {
  const insumos = await insumoService.getBajoStock();
  res.json({ insumos, total: insumos.length });
}

async function actualizarRegistro(req, res) {
  const reg = await insumoService.updateCitaInsumo(req.params.id, req.body);
  res.json({ registro: reg });
}

async function log(req, res) {
  const { idTrabajador, fecha } = req.query;
  const registros = await insumoService.getLog({
    idTrabajador: idTrabajador || null,
    fecha:        fecha        || null,
  });
  res.json({ registros, total: registros.length });
}

async function prediccion(req, res) {
  const items = await insumoService.getPrediccion();
  const conAlertas = items.filter(i => i.alertas.length > 0);
  res.json({ items, alertas: conAlertas, total_alertas: conAlertas.length });
}

module.exports = { list, crear, actualizar, alertas, listByCita, registrar, actualizarRegistro, log, prediccion };
