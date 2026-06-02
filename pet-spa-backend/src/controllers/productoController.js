'use strict';

const productoService = require('../services/productoService');

async function listar(req, res) {
  const { categoria, buscar } = req.query;
  const productos = await productoService.listarProductos({ categoria, buscar });
  res.json({ productos });
}

async function getOne(req, res) {
  const producto = await productoService.getProducto(req.params.id);
  res.json({ producto });
}

async function crear(req, res) {
  const producto = await productoService.crearProducto(req.body, req.file);
  res.status(201).json({ producto });
}

async function actualizar(req, res) {
  const producto = await productoService.actualizarProducto(req.params.id, req.body, req.file);
  res.json({ producto });
}

async function eliminarImagen(req, res) {
  const producto = await productoService.eliminarImagen(req.params.id);
  res.json({ producto });
}

async function eliminar(req, res) {
  await productoService.eliminarProducto(req.params.id);
  res.json({ message: 'Producto desactivado.' });
}

module.exports = { listar, getOne, crear, actualizar, eliminarImagen, eliminar };
