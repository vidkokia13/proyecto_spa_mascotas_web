'use strict';

const mascotaService = require('../services/mascotaService');
const AppError       = require('../utils/AppError');

async function listar(req, res) {
  const { id_usuario: idUsuario, rol } = req.user;
  // Admin/jefe/recepcion/trabajador can query by ?idUsuario=; cliente only sees own
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
  // Receptionist/admin can create for another user
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
  const url = `/uploads/carnets/${req.file.filename}`;
  const mascota = await mascotaService.updateMascota(
    req.params.id, req.user.id_usuario, req.user.rol, { carnet_vacunas_url: url },
  );
  res.json({ mascota, carnet_vacunas_url: url });
}

module.exports = { listar, getOne, crear, actualizar, eliminar, subirCarnet };
