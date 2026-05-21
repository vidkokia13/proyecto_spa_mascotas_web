'use strict';

const servicioService = require('../services/servicioService');

async function listar(req, res) {
  const soloActivos = req.query.todos !== 'true';
  const servicios = await servicioService.listar(soloActivos);
  res.json({ servicios });
}

async function getOne(req, res) {
  const servicio = await servicioService.getById(req.params.id);
  res.json({ servicio });
}

async function crear(req, res) {
  const servicio = await servicioService.crear(req.body);
  res.status(201).json({ servicio });
}

async function actualizar(req, res) {
  const servicio = await servicioService.actualizar(req.params.id, req.body);
  res.json({ servicio });
}

module.exports = { listar, getOne, crear, actualizar };
