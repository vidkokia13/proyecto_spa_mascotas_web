'use strict';

const Joi = require('joi');

const create = Joi.object({
  tipo:         Joi.string().valid('feriado','mantenimiento','cierre','vacaciones','ausencia','otro').default('otro'),
  fechaInicio:  Joi.date().iso().required(),
  fechaFin:     Joi.date().iso().greater(Joi.ref('fechaInicio')).required()
    .messages({ 'date.greater': 'La fecha de fin debe ser posterior al inicio.' }),
  motivo:       Joi.string().trim().max(500).allow('', null),
  idTrabajador: Joi.string().uuid().allow(null),
});

const idParam = Joi.object({ id: Joi.string().uuid().required() });

module.exports = { create, idParam };
