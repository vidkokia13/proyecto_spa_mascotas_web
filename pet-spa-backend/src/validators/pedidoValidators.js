'use strict';

const Joi = require('joi');

const idParam = Joi.object({
  id: Joi.string().required(),
});

const itemSchema = Joi.object({
  idProducto: Joi.string().required(),
  cantidad:   Joi.number().integer().min(1).required(),
});

const create = Joi.object({
  items: Joi.array().items(itemSchema).min(1).required(),
  notas: Joi.string().max(500).allow('', null),
});

const cambiarEstado = Joi.object({
  estado:     Joi.string().valid('borrador', 'enviado', 'completado', 'cancelado').required(),
  metodo:     Joi.string().valid('efectivo', 'qr', 'transferencia').when('estado', {
    is: 'completado', then: Joi.required(), otherwise: Joi.optional(),
  }),
  referencia: Joi.string().max(100).allow('', null),
});

module.exports = { idParam, create, cambiarEstado };
