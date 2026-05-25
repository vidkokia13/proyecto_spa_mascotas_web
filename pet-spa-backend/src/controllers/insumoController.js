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
  const { id_usuario: idUsuario, rol } = req.user;
  const { idCita, insumos } = req.body;
  const result = await insumoService.registrarInsumos({ idCita, idUsuario, rol, insumos });
  res.status(201).json({ registros: result });
}

async function actualizarRegistro(req, res) {
  const reg = await insumoService.updateCitaInsumo(req.params.id, req.body);
  res.json({ registro: reg });
}

module.exports = { list, crear, actualizar, listByCita, registrar, actualizarRegistro };
