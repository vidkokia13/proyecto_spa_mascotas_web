/**
 * middlewares/validate.js
 * -----------------------
 * Middleware genérico para validar req.body / req.params / req.query
 * contra un schema de Joi. Reemplaza el valor con el resultado
 * "casteado" por Joi (default values, trims, lowercase, etc.).
 *
 * @example
 *   router.post('/login', validate(loginSchema, 'body'), ctrl.login);
 */
'use strict';

const AppError = require('../utils/AppError');

function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const { value, error } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return next(new AppError('Datos inválidos', 400, 'VALIDATION_ERROR', details));
    }

    req[source] = value;
    return next();
  };
}

module.exports = validate;
