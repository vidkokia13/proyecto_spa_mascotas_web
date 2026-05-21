'use strict';

const { Router }        = require('express');
const authRequired      = require('../middlewares/authRequired');
const requireRole       = require('../middlewares/requireRole');
const validate          = require('../middlewares/validate');
const asyncHandler      = require('../utils/asyncHandler');
const horarioController = require('../controllers/horarioController');
const horarioValidators = require('../validators/horarioValidators');

const router = Router();

// Public: read spa schedule
router.get('/', asyncHandler(horarioController.getHorarios));

// Admin/jefe: manage spa schedule
router.post('/',          authRequired, requireRole('admin','jefe'), validate(horarioValidators.setHorario, 'body'), asyncHandler(horarioController.setHorario));
router.patch('/:dia',     authRequired, requireRole('admin','jefe'), validate(horarioValidators.diaSemanaParam, 'params'), validate(horarioValidators.toggleHorario, 'body'), asyncHandler(horarioController.toggleHorario));

// Groomer availability (groomer manages own; admin/jefe manage any)
router.get('/groomers/:idTrabajador',              authRequired, asyncHandler(horarioController.getDisponibilidadGroomer));
router.post('/groomers',                           authRequired, requireRole('admin','jefe','trabajador'), validate(horarioValidators.setDisponibilidad, 'body'), asyncHandler(horarioController.setDisponibilidadGroomer));
router.delete('/groomers/:idTrabajador/dia/:dia',  authRequired, requireRole('admin','jefe','trabajador'), asyncHandler(horarioController.removeDisponibilidadGroomer));

module.exports = router;
