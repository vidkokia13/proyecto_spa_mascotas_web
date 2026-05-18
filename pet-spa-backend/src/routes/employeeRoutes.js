/**
 * routes/employeeRoutes.js
 * ------------------------
 * /api/empleados/*
 *
 * Todas las rutas requieren autenticación y rol admin o jefe.
 */
'use strict';

const { Router } = require('express');

const employeeController = require('../controllers/employeeController');
const authRequired = require('../middlewares/authRequired');
const requireRole = require('../middlewares/requireRole');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { create, update, idParam } = require('../validators/employeeValidators');

const router = Router();

// Todas las rutas: autenticación + (admin|jefe)
router.use(authRequired, requireRole('admin', 'jefe'));

router.post(
  '/',
  validate(create, 'body'),
  asyncHandler(employeeController.create),
);

router.get(
  '/',
  asyncHandler(employeeController.list),
);

router.get(
  '/:id',
  validate(idParam, 'params'),
  asyncHandler(employeeController.getOne),
);

router.patch(
  '/:id',
  validate(idParam, 'params'),
  validate(update, 'body'),
  asyncHandler(employeeController.update),
);

module.exports = router;
