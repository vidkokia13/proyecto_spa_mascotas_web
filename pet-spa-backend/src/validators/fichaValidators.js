'use strict';

const Joi = require('joi');

const save = Joi.object({
  idCita:        Joi.string().required(),
  estadoPelaje:  Joi.string().max(50).allow(null,'').optional(),
  condicionPiel: Joi.string().max(50).allow(null,'').optional(),
  observaciones: Joi.string().max(1000).allow(null,'').optional(),
  pesoActual:    Joi.number().positive().allow(null).optional(),
});

const idCitaParam = Joi.object({ idCita: Joi.string().required() });

module.exports = { save, idCitaParam };
