'use strict';

const Joi = require('joi');

const createItem = Joi.object({
  idServicio:  Joi.string().allow(null,'').optional(),
  descripcion: Joi.string().min(3).max(200).required(),
  orden:       Joi.number().integer().min(0).default(0),
});

const updateItem = Joi.object({
  descripcion: Joi.string().min(3).max(200).optional(),
  orden:       Joi.number().integer().min(0).optional(),
  activo:      Joi.boolean().optional(),
  id_servicio: Joi.string().allow(null,'').optional(),
}).min(1);

const toggleItem = Joi.object({ completado: Joi.boolean().required() });

const citaItemParams = Joi.object({
  idCita: Joi.string().required(),
  idItem: Joi.string().required(),
});

const idParam = Joi.object({ id: Joi.string().required() });
const idCitaParam = Joi.object({ idCita: Joi.string().required() });

module.exports = { createItem, updateItem, toggleItem, citaItemParams, idParam, idCitaParam };
