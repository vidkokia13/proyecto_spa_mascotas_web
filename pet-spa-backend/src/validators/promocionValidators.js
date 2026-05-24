'use strict';

const Joi = require('joi');

const create = Joi.object({
  nombre:      Joi.string().trim().min(2).max(100).required(),
  descripcion: Joi.string().trim().max(500).allow('', null),
  tipo:        Joi.string().valid('porcentaje', 'monto_fijo').required(),
  valor:       Joi.number().positive().required()
    .when('tipo', { is: 'porcentaje', then: Joi.number().max(100) }),
  codigo:      Joi.string().trim().alphanum().min(3).max(30).allow(null, ''),
  fechaInicio: Joi.date().iso().required(),
  fechaFin:    Joi.date().iso().min(Joi.ref('fechaInicio')).required()
    .messages({ 'date.min': 'La fecha de fin debe ser igual o posterior al inicio.' }),
});

const update = Joi.object({
  nombre:      Joi.string().trim().min(2).max(100),
  descripcion: Joi.string().trim().max(500).allow('', null),
  tipo:        Joi.string().valid('porcentaje', 'monto_fijo'),
  valor:       Joi.number().positive(),
  codigo:      Joi.string().trim().alphanum().min(3).max(30).allow(null, ''),
  fechaInicio: Joi.date().iso(),
  fechaFin:    Joi.date().iso(),
  activo:      Joi.boolean(),
}).min(1);

const verificar = Joi.object({
  codigo:    Joi.string().trim().required(),
  montoBase: Joi.number().positive().required(),
});

const idParam = Joi.object({ id: Joi.string().required() });

module.exports = { create, update, verificar, idParam };
