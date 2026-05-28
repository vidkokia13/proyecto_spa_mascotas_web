'use strict';

const fichaService = require('../services/fichaService');

async function get(req, res) {
  const ficha = await fichaService.getFicha(req.params.idCita);
  res.json({ ficha: ficha || null });
}

async function save(req, res) {
  const { id_usuario: idUsuario, id_trabajador: idTrabajador, rol } = req.user;
  const { idCita, estadoPelaje, condicionPiel, observaciones, pesoActual,
    estadoIngreso, recomendaciones } = req.body;
  const ficha = await fichaService.saveFicha({
    idCita, estadoPelaje, condicionPiel, observaciones, pesoActual,
    estadoIngreso, recomendaciones, idUsuario, idTrabajador, rol,
  });
  res.status(201).json({ ficha });
}

module.exports = { get, save };
