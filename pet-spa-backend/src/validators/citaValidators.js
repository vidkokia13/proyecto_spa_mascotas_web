'use strict';

const Joi = require('joi');

const ESTADOS = ['pendiente','confirmada','en_proceso','completada','cancelada'];

const create = Joi.object({
  idMascota:       Joi.string().uuid().required(),
  idServicio:      Joi.string().uuid().required(),
  idTrabajador:    Joi.string().uuid().allow(null),
  fechaHoraInicio: Joi.date().iso().min('now').required()
    .messages({ 'date.min': 'La fecha de la cita debe ser futura.' }),
  notas:           Joi.string().trim().max(500).allow('', null),
});

const updateEstado = Joi.object({
  estado: Joi.string().valid(...ESTADOS).required(),
});

const queryRango = Joi.object({
  fechaInicio:  Joi.date().iso().required(),
  fechaFin:     Joi.date().iso().greater(Joi.ref('fechaInicio')).required(),
  idTrabajador: Joi.string().uuid().allow(null, ''),
  estado:       Joi.string().valid(...ESTADOS).allow(null, ''),
});

const getSlotsQuery = Joi.object({
  fecha:        Joi.date().iso().min('now').required(),
  idServicio:   Joi.string().uuid().required(),
  idMascota:    Joi.string().uuid().required(),
  idTrabajador: Joi.string().uuid().allow(null, ''),
});

const idParam = Joi.object({ id: Joi.string().uuid().required() });

module.exports = { create, updateEstado, queryRango, getSlotsQuery, idParam };
