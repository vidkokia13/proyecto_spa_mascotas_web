'use strict';

const pedidoService = require('../services/pedidoService');

async function crear(req, res) {
  const { id_usuario: idUsuario } = req.user;
  const result = await pedidoService.crearPedido({ idUsuario, ...req.body });
  res.status(201).json(result);
}

async function getOne(req, res) {
  const { id_usuario: idUsuario, rol } = req.user;
  const result = await pedidoService.getPedido(req.params.id, idUsuario, rol);
  res.json(result);
}

async function misPedidos(req, res) {
  const pedidos = await pedidoService.listarMisPedidos(req.user.id_usuario);
  res.json({ pedidos });
}

async function listarTodos(req, res) {
  const { estado } = req.query;
  const pedidos = await pedidoService.listarTodos({ estado });
  res.json({ pedidos });
}

async function cambiarEstado(req, res) {
  const { estado, metodo, referencia } = req.body;
  const pedido = await pedidoService.cambiarEstado(req.params.id, estado, {
    metodo,
    referencia,
    idUsuario: req.user.id_usuario,
  });
  res.json({ pedido });
}

async function whatsapp(req, res) {
  const link = await pedidoService.generarLinkWhatsApp(req.params.id, req.query.tel);
  res.json({ link });
}

module.exports = { crear, getOne, misPedidos, listarTodos, cambiarEstado, whatsapp };
