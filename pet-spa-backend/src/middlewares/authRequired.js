/**
 * middlewares/authRequired.js
 * ---------------------------
 * Verifica el header `Authorization: Bearer <token>`, decodifica el JWT
 * y adjunta los datos a `req.user`.
 *
 * Estructura de req.user:
 *   {
 *     id_usuario:    UUID,
 *     id_rol:        number,
 *     rol:           'cliente' | 'trabajador' | 'admin' | 'jefe',
 *     id_cliente:    UUID | null,
 *     id_trabajador: UUID | null,
 *   }
 *
 * Estos campos los consume luego requireRole y los módulos posteriores
 * (citas/grooming/caja).
 */
'use strict';

const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

function authRequired(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Token no provisto', 401, 'NO_TOKEN'));
  }

  const payload = verifyToken(token); // lanza AppError 401 si es inválido

  req.user = {
    id_usuario: payload.id_usuario,
    id_rol: payload.id_rol,
    rol: payload.rol,
    id_cliente: payload.id_cliente || null,
    id_trabajador: payload.id_trabajador || null,
  };

  return next();
}

module.exports = authRequired;
