'use strict';

const fotoService = require('../services/fotoService');

async function list(req, res) {
  const fotos = await fotoService.getFotos(req.params.idCita);
  res.json({ fotos });
}

async function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ningún archivo.' });
  }
  const { id_usuario: idUsuario, id_trabajador: idTrabajador, rol } = req.user;
  const tipo = req.body.tipo ?? 'antes';
  const foto = await fotoService.uploadFoto({
    idCita:      req.params.idCita,
    tipo,
    url:         req.file.path,
    idUsuario,
    idTrabajador,
    rol,
  });
  res.status(201).json({ foto });
}

async function remove(req, res) {
  const { id_usuario: idUsuario, rol } = req.user;
  await fotoService.deleteFoto(req.params.id, idUsuario, rol);
  res.json({ message: 'Foto eliminada.' });
}

module.exports = { list, upload, remove };
