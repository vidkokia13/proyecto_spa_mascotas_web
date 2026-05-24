'use strict';

const Joi = require('joi');

const create = Joi.object({
  idCita:          Joi.string().required(),
  monto:           Joi.number().positive().required(),
  metodo:          Joi.string().valid('efectivo','qr','transferencia').required(),
  referencia:      Joi.string().max(100).allow(null,'').optional(),
  idPromocion:     Joi.string().allow(null,'').optional(),
  codigoPromocion: Joi.string().trim().max(30).allow(null,'').optional(),
});

const idParam = Joi.object({ id: Joi.string().required() });

module.exports = { create, idParam };
