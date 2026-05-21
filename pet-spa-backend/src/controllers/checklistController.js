'use strict';

const checklistService = require('../services/checklistService');

async function listItems(req, res) {
  const { idServicio } = req.query;
  const items = await checklistService.getItems({ idServicio: idServicio || null });
  res.json({ items });
}

async function createItem(req, res) {
  const item = await checklistService.createItem(req.body);
  res.status(201).json({ item });
}

async function updateItem(req, res) {
  const item = await checklistService.updateItem(req.params.id, req.body);
  res.json({ item });
}

async function getCitaChecklist(req, res) {
  const items = await checklistService.getCitaChecklist(req.params.idCita);
  res.json({ checklist: items });
}

async function toggleItem(req, res) {
  const { id: idUsuario, rol } = req.user;
  const { idCita, idItem } = req.params;
  const { completado } = req.body;
  const row = await checklistService.toggleItem(idCita, idItem, completado, idUsuario, rol);
  res.json({ item: row });
}

module.exports = { listItems, createItem, updateItem, getCitaChecklist, toggleItem };
