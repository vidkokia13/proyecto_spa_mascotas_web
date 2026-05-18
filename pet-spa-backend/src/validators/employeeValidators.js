'use strict';

const Joi = require('joi');

// Admin crea empleados con contraseña temporal simple (ej: CI del empleado).
// El empleado DEBE cambiarla en su primer login.
const create = Joi.object({
  nombre:              Joi.string().trim().min(2).max(100).required(),
  email:               Joi.string().trim().lowercase().email().max(255).required(),
  password:            Joi.string().min(4).max(72).required()
    .messages({ 'string.min': 'La contraseña temporal debe tener al menos 4 caracteres.' }),
  rol:                 Joi.string().valid('trabajador', 'admin', 'jefe').required(),
  sueldoMensual:       Joi.number().precision(2).min(0).allow(null),
  activo:              Joi.boolean().default(true),
  turno:               Joi.string().trim().max(50).allow('', null),
  telefono:            Joi.string().trim().max(20).allow('', null),
  especialidad:        Joi.string().trim().max(100).allow('', null),
  capacidadSimultanea: Joi.number().integer().min(1).max(20).default(1),
});

const update = Joi.object({
  estado:              Joi.string().valid('activo', 'inactivo'),
  turno:               Joi.string().trim().max(50).allow('', null),
  especialidad:        Joi.string().trim().max(100).allow('', null),
  activo:              Joi.boolean(),
  telefono:            Joi.string().trim().max(20).allow('', null),
  sueldoMensual:       Joi.number().precision(2).min(0).allow(null),
  capacidadSimultanea: Joi.number().integer().min(1).max(20),
}).min(1).messages({ 'object.min': 'Debe enviar al menos un campo a actualizar.' });

const idParam = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = { create, update, idParam };
