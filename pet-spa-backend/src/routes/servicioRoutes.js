'use strict';

const { Router }        = require('express');
const authRequired      = require('../middlewares/authRequired');
const requireRole       = require('../middlewares/requireRole');
const validate          = require('../middlewares/validate');
const asyncHandler      = require('../utils/asyncHandler');
const servicioController = require('../controllers/servicioController');
const servicioValidators = require('../validators/servicioValidators');

const router = Router();

// Public: list and get one service (clients need this before booking)
router.get('/',    asyncHandler(servicioController.listar));
router.get('/:id', validate(servicioValidators.idParam, 'params'), asyncHandler(servicioController.getOne));

// Admin/jefe only: create and update
router.post('/',    authRequired, requireRole('admin','jefe'), validate(servicioValidators.create, 'body'),  asyncHandler(servicioController.crear));
router.patch('/:id',authRequired, requireRole('admin','jefe'), validate(servicioValidators.idParam, 'params'), validate(servicioValidators.update, 'body'), asyncHandler(servicioController.actualizar));

module.exports = router;
