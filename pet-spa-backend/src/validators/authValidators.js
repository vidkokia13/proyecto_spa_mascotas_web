'use strict';

const Joi = require('joi');

const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const passwordSchema = Joi.string()
  .min(8)
  .max(72)
  .pattern(STRONG_PASSWORD)
  .required()
  .messages({
    'string.pattern.base':
      'La contraseña debe tener al menos 8 caracteres e incluir mayúscula, minúscula, número y símbolo.',
    'string.max': 'La contraseña no puede superar los 72 caracteres.',
  });

const register = Joi.object({
  nombre:              Joi.string().trim().min(2).max(100).required(),
  email:               Joi.string().trim().lowercase().email().max(255).required(),
  password:            passwordSchema,
  telefono:            Joi.string().trim().max(20).allow('', null),
  ci:                  Joi.string().trim().max(20).allow('', null),
  direccion:           Joi.string().trim().max(255).allow('', null),
  canalNotificacion:   Joi.string().valid('email', 'whatsapp', 'sms').default('email'),
  horariosPreferidos:  Joi.string().trim().max(100).allow('', null),
});

const login = Joi.object({
  email:    Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(1).max(72).required(),
});

const changePassword = Joi.object({
  currentPassword: Joi.string().min(1).max(72).required(),
  newPassword:     passwordSchema,
});

const verify2FA = Joi.object({
  two_factor_token: Joi.string().required(),
  code:             Joi.string().length(6).pattern(/^\d{6}$/).required()
    .messages({ 'string.pattern.base': 'El código debe ser de 6 dígitos.' }),
});

const verifySetup2FA = Joi.object({
  code: Joi.string().length(6).pattern(/^\d{6}$/).required()
    .messages({ 'string.pattern.base': 'El código debe ser de 6 dígitos.' }),
});

module.exports = { register, login, changePassword, verify2FA, verifySetup2FA };
