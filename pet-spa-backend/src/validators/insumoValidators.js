'use strict';

const Joi = require('joi');

const create = Joi.object({
  nombre:      Joi.string().min(2).max(100).required(),
  unidad:      Joi.string().max(30).default('unidad'),
  stock:       Joi.number().min(0).default(0),
  stockMinimo: Joi.number().integer().min(0).default(5),
});

const update = Joi.object({
  nombre:      Joi.string().min(2).max(100).optional(),
  unidad:      Joi.string().max(30).optional(),
  stock:       Joi.number().min(0).optional(),
  stockMinimo: Joi.number().integer().min(0).optional(),
  activo:      Joi.boolean().optional(),
}).min(1);

const registrarInsumos = Joi.object({
  idCita:   Joi.string().required(),
  insumos:  Joi.array().items(Joi.object({
    idInsumo:         Joi.string().required(),
    cantidadRecibida: Joi.number().min(0).default(0),
    cantidadUsada:    Joi.number().min(0).default(0),
    cantidadDevuelta: Joi.number().min(0).default(0),
    desperdicio:      Joi.number().min(0).default(0),
  })).min(1).required(),
});

const updateCitaInsumo = Joi.object({
  cantidadRecibida: Joi.number().min(0).optional(),
  cantidadUsada:    Joi.number().min(0).optional(),
  cantidadDevuelta: Joi.number().min(0).optional(),
  desperdicio:      Joi.number().min(0).optional(),
}).min(1);

const idParam     = Joi.object({ id:     Joi.string().required() });
const idCitaParam = Joi.object({ idCita: Joi.string().required() });

module.exports = { create, update, registrarInsumos, updateCitaInsumo, idParam, idCitaParam };
