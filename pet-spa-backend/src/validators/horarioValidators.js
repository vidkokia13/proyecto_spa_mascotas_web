'use strict';

const Joi = require('joi');

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const setHorario = Joi.object({
  diaSemana:    Joi.number().integer().min(0).max(6).required(),
  horaInicio:   Joi.string().pattern(TIME_RE).required().messages({ 'string.pattern.base': 'Formato HH:MM requerido.' }),
  horaFin:      Joi.string().pattern(TIME_RE).required().messages({ 'string.pattern.base': 'Formato HH:MM requerido.' }),
  capacidadMax: Joi.number().integer().min(1).max(50).default(5),
});

const toggleHorario = Joi.object({
  activo: Joi.boolean().required(),
});

const diaSemanaParam = Joi.object({
  dia: Joi.number().integer().min(0).max(6).required(),
});

const setDisponibilidad = Joi.object({
  idTrabajador: Joi.string().uuid().required(),
  diaSemana:    Joi.number().integer().min(0).max(6).required(),
  horaInicio:   Joi.string().pattern(TIME_RE).required(),
  horaFin:      Joi.string().pattern(TIME_RE).required(),
});

const removeDisponibilidad = Joi.object({
  idTrabajador: Joi.string().uuid().required(),
  dia:          Joi.number().integer().min(0).max(6).required(),
});

module.exports = { setHorario, toggleHorario, diaSemanaParam, setDisponibilidad, removeDisponibilidad };
