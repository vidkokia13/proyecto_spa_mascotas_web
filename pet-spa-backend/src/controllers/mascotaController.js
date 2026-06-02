'use strict';

const mascotaService = require('../services/mascotaService');
const AppError       = require('../utils/AppError');

async function listar(req, res) {
  const { id_usuario: idUsuario, rol } = req.user;
  const target = (['admin','jefe','recepcion','trabajador'].includes(rol) && req.query.idUsuario)
    ? req.query.idUsuario
    : idUsuario;
  const mascotas = await mascotaService.getMisMascotas(target);
  res.json({ mascotas });
}

async function getOne(req, res) {
  const mascota = await mascotaService.getMascota(req.params.id, req.user.id_usuario, req.user.rol);
  res.json({ mascota });
}

async function crear(req, res) {
  const { id_usuario: idUsuario, rol } = req.user;
  const targetUsuario = (['admin','jefe','recepcion'].includes(rol) && req.body.idUsuario)
    ? req.body.idUsuario
    : idUsuario;
  const mascota = await mascotaService.createMascota(targetUsuario, req.body);
  res.status(201).json({ mascota });
}

async function actualizar(req, res) {
  const mascota = await mascotaService.updateMascota(req.params.id, req.user.id_usuario, req.user.rol, req.body);
  res.json({ mascota });
}

async function eliminar(req, res) {
  await mascotaService.deleteMascota(req.params.id, req.user.id_usuario, req.user.rol);
  res.json({ message: 'Mascota desactivada.' });
}

async function subirCarnet(req, res) {
  if (!req.file) throw new AppError('No se recibió ningún archivo.', 400, 'NO_FILE');
  const url = req.file.path;
  const mascota = await mascotaService.updateMascota(
    req.params.id, req.user.id_usuario, req.user.rol, { carnet_vacunas_url: url },
  );
  res.json({ mascota, carnet_vacunas_url: url });
}

async function subirFoto(req, res) {
  if (!req.file) throw new AppError('No se recibió ningún archivo.', 400, 'NO_FILE');
  const mascota = await mascotaService.getMascota(req.params.id, req.user.id_usuario, req.user.rol);
  // Eliminar foto anterior en Cloudinary si existe
  if (mascota.foto_public_id) {
    const { cloudinary } = require('../config/cloudinary');
    await cloudinary.uploader.destroy(mascota.foto_public_id).catch(() => null);
  }
  const updated = await mascotaService.updateMascota(
    req.params.id, req.user.id_usuario, req.user.rol,
    { foto_url: req.file.path, foto_public_id: req.file.filename },
  );
  res.json({ mascota: updated });
}

async function eliminarFoto(req, res) {
  const mascota = await mascotaService.getMascota(req.params.id, req.user.id_usuario, req.user.rol);
  if (!mascota.foto_public_id) throw new AppError('La mascota no tiene foto.', 400, 'NO_PHOTO');
  const { cloudinary } = require('../config/cloudinary');
  await cloudinary.uploader.destroy(mascota.foto_public_id);
  const updated = await mascotaService.updateMascota(
    req.params.id, req.user.id_usuario, req.user.rol,
    { foto_url: null, foto_public_id: null },
  );
  res.json({ mascota: updated });
}

module.exports = { listar, getOne, crear, actualizar, eliminar, subirCarnet, subirFoto, eliminarFoto };
