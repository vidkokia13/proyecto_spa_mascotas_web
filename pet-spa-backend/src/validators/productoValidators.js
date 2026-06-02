'use strict';

const Joi = require('joi');

const CATEGORIAS = ['alimento', 'accesorio', 'higiene', 'juguete', 'salud', 'otro'];

const idParam = Joi.object({
  id: Joi.string().required(),
});

const create = Joi.object({
  nombre:      Joi.string().min(2).max(150).required(),
  descripcion: Joi.string().max(500).allow('', null),
  categoria:   Joi.string().valid(...CATEGORIAS).default('otro'),
  precio:      Joi.number().positive().required(),
  stock:       Joi.number().integer().min(0).default(0),
  stockMinimo: Joi.number().integer().min(0).default(5),
});

const update = Joi.object({
  nombre:      Joi.string().min(2).max(150),
  descripcion: Joi.string().max(500).allow('', null),
  categoria:   Joi.string().valid(...CATEGORIAS),
  precio:      Joi.number().positive(),
  stock:       Joi.number().integer().min(0),
  stockMinimo: Joi.number().integer().min(0),
  activo:      Joi.boolean(),
}).min(1);

module.exports = { idParam, create, update };
