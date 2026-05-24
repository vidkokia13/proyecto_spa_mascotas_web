'use strict';

const { Router }      = require('express');
const authRequired    = require('../middlewares/authRequired');
const requireRole     = require('../middlewares/requireRole');
const validate        = require('../middlewares/validate');
const asyncHandler    = require('../utils/asyncHandler');
const citaController  = require('../controllers/citaController');
const citaValidators  = require('../validators/citaValidators');

const router = Router();
router.use(authRequired);

// Cliente: see own appointments
router.get('/mis-citas', asyncHandler(citaController.misCitas));

// Calendario agrupado por groomer (dia o semana)
router.get('/calendario', requireRole('admin','jefe','recepcion','trabajador'), asyncHandler(citaController.calendario));

// Staff: list appointments by date range
router.get('/', requireRole('admin','jefe','recepcion','trabajador'), validate(citaValidators.queryRango, 'query'), asyncHandler(citaController.listRango));

// All authenticated: create appointment
router.post('/', validate(citaValidators.create, 'body'), asyncHandler(citaController.crear));

// Single appointment
router.get('/:id',          validate(citaValidators.idParam, 'params'), asyncHandler(citaController.getOne));
router.patch('/:id/estado', validate(citaValidators.idParam, 'params'), validate(citaValidators.updateEstado, 'body'), asyncHandler(citaController.cambiarEstado));
// Cliente cancela su propia cita (con política de 24h)
router.patch('/:id/cancelar',    validate(citaValidators.idParam, 'params'), validate(citaValidators.cancelar, 'body'), asyncHandler(citaController.cancelarPorCliente));
router.patch('/:id/reprogramar', requireRole('admin','jefe','recepcion'), validate(citaValidators.idParam, 'params'), validate(citaValidators.reprogramar, 'body'), asyncHandler(citaController.reprogramar));
router.patch('/:id',             requireRole('admin','jefe','recepcion'), validate(citaValidators.idParam, 'params'), asyncHandler(citaController.actualizar));

module.exports = router;
