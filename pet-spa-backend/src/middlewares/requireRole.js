/**
 * middlewares/requireRole.js
 * --------------------------
 * Middleware de control de acceso basado en roles (RBAC).
 *
 * @example
 *   router.post('/empleados',
 *     authRequired,
 *     requireRole('admin', 'jefe'),
 *     controller.create
 *   );
 */
'use strict';

const AppError = require('../utils/AppError');

function requireRole(...rolesPermitidos) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('No autenticado', 401, 'NOT_AUTHENTICATED'));
    }
    if (!rolesPermitidos.includes(req.user.rol)) {
      return next(new AppError(
        'No tenés permisos para esta acción',
        403,
        'FORBIDDEN',
      ));
    }
    return next();
  };
}

module.exports = requireRole;
