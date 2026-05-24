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

const reprogramar = Joi.object({
  fechaHoraInicio: Joi.date().iso().min('now').required()
    .messages({ 'date.min': 'La nueva fecha debe ser futura.' }),
});

const MOTIVOS_CANCELACION = ['salud','tiempo','emergencia','otro'];

const cancelar = Joi.object({
  motivo:    Joi.string().valid(...MOTIVOS_CANCELACION).required()
    .messages({ 'any.only': `El motivo debe ser: ${MOTIVOS_CANCELACION.join(', ')}.` }),
  detalle:   Joi.string().trim().max(300).allow('', null),
  aceptaPolitica: Joi.boolean().valid(true).required()
    .messages({ 'any.only': 'Debes aceptar la política de cancelación.' }),
});

const idParam = Joi.object({ id: Joi.string().uuid().required() });

module.exports = { create, updateEstado, queryRango, getSlotsQuery, reprogramar, cancelar, idParam };
