'use strict';

const productoRepo = require('../repositories/productoRepository');
const { cloudinary } = require('../config/cloudinary');
const AppError      = require('../utils/AppError');

async function listarProductos(filtros) {
  return productoRepo.findAll(filtros);
}

async function getProducto(idProducto) {
  const producto = await productoRepo.findById(idProducto);
  if (!producto) throw new AppError('Producto no encontrado.', 404, 'NOT_FOUND');
  return producto;
}

async function crearProducto(data, file) {
  const payload = { ...data };
  if (file) {
    payload.imagenUrl      = file.path;
    payload.imagenPublicId = file.filename;
  }
  return productoRepo.create(payload);
}

async function actualizarProducto(idProducto, data, file) {
  const existing = await productoRepo.findById(idProducto);
  if (!existing) throw new AppError('Producto no encontrado.', 404, 'NOT_FOUND');

  const fields = { ...data };

  if (file) {
    // Eliminar imagen anterior de Cloudinary si existe
    if (existing.imagen_public_id) {
      await cloudinary.uploader.destroy(existing.imagen_public_id).catch(() => null);
    }
    fields.imagen_url       = file.path;
    fields.imagen_public_id = file.filename;
  }

  return productoRepo.update(idProducto, fields);
}

async function eliminarImagen(idProducto) {
  const producto = await productoRepo.findById(idProducto);
  if (!producto) throw new AppError('Producto no encontrado.', 404, 'NOT_FOUND');
  if (!producto.imagen_public_id) throw new AppError('El producto no tiene imagen.', 400, 'NO_IMAGE');

  await cloudinary.uploader.destroy(producto.imagen_public_id);
  return productoRepo.update(idProducto, { imagen_url: null, imagen_public_id: null });
}

async function eliminarProducto(idProducto) {
  const producto = await productoRepo.findById(idProducto);
  if (!producto) throw new AppError('Producto no encontrado.', 404, 'NOT_FOUND');

  if (producto.imagen_public_id) {
    await cloudinary.uploader.destroy(producto.imagen_public_id).catch(() => null);
  }
  return productoRepo.remove(idProducto);
}

module.exports = { listarProductos, getProducto, crearProducto, actualizarProducto, eliminarImagen, eliminarProducto };
