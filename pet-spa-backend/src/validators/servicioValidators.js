'use strict';

const Joi = require('joi');

const create = Joi.object({
  nombre:       Joi.string().trim().min(1).max(100).required(),
  descripcion:  Joi.string().trim().max(500).allow('', null),
  duracionBase: Joi.number().integer().min(5).max(480).required(),
  precioBase:   Joi.number().precision(2).min(0).default(0),
  categoria:    Joi.string().trim().max(50).allow('', null),
});

const update = Joi.object({
  nombre:       Joi.string().trim().min(1).max(100),
  descripcion:  Joi.string().trim().max(500).allow('', null),
  duracion_base: Joi.number().integer().min(5).max(480),
  precio_base:   Joi.number().precision(2).min(0),
  categoria:    Joi.string().trim().max(50).allow('', null),
  activo:       Joi.boolean(),
}).min(1).messages({ 'object.min': 'Debe enviar al menos un campo.' });

const idParam = Joi.object({ id: Joi.string().uuid().required() });

module.exports = { create, update, idParam };
