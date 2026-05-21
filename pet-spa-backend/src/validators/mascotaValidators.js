'use strict';

const Joi = require('joi');

const TAMANOS     = ['pequeno','mediano','grande','gigante'];
const TEMPERAMENTOS = ['tranquilo','nervioso','agresivo'];

const create = Joi.object({
  nombre:          Joi.string().trim().min(1).max(100).required(),
  especie:         Joi.string().trim().max(50).default('perro'),
  raza:            Joi.string().trim().max(100).allow('', null),
  tamano:          Joi.string().valid(...TAMANOS).default('mediano'),
  temperamento:    Joi.string().valid(...TEMPERAMENTOS).default('tranquilo'),
  tiempoExtraMin:  Joi.number().integer().min(0).default(0),
  pesoKg:          Joi.number().precision(2).positive().allow(null),
  notas:           Joi.string().trim().max(1000).allow('', null),
});

const update = Joi.object({
  nombre:         Joi.string().trim().min(1).max(100),
  especie:        Joi.string().trim().max(50),
  raza:           Joi.string().trim().max(100).allow('', null),
  tamano:         Joi.string().valid(...TAMANOS),
  temperamento:   Joi.string().valid(...TEMPERAMENTOS),
  tiempoExtraMin: Joi.number().integer().min(0),
  pesoKg:         Joi.number().precision(2).positive().allow(null),
  notas:          Joi.string().trim().max(1000).allow('', null),
  activo:         Joi.boolean(),
}).min(1).messages({ 'object.min': 'Debe enviar al menos un campo.' });

const idParam = Joi.object({ id: Joi.string().uuid().required() });

module.exports = { create, update, idParam };
