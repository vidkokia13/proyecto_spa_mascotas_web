'use strict';

const promocionService = require('../services/promocionService');

async function listar(req, res) {
  const soloActivas = req.query.soloActivas === 'true';
  const promociones = await promocionService.listPromociones(soloActivas);
  res.json({ promociones });
}

async function getOne(req, res) {
  const promo = await promocionService.getPromocion(req.params.id);
  res.json({ promocion: promo });
}

async function verificar(req, res) {
  const { codigo, montoBase } = req.body;
  const result = await promocionService.verificarCodigo(codigo, parseFloat(montoBase));
  res.json(result);
}

async function crear(req, res) {
  const promo = await promocionService.createPromocion(req.body, req.user.id_usuario, req.ip);
  res.status(201).json({ promocion: promo });
}

async function actualizar(req, res) {
  const promo = await promocionService.updatePromocion(req.params.id, req.body, req.user.id_usuario, req.ip);
  res.json({ promocion: promo });
}

async function eliminar(req, res) {
  await promocionService.removePromocion(req.params.id, req.user.id_usuario, req.ip);
  res.json({ message: 'Promoción desactivada.' });
}

module.exports = { listar, getOne, verificar, crear, actualizar, eliminar };
