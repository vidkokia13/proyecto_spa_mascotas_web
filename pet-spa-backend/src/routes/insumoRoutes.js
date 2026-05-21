'use strict';

const { Router }        = require('express');
const authRequired      = require('../middlewares/authRequired');
const requireRole       = require('../middlewares/requireRole');
const validate          = require('../middlewares/validate');
const asyncHandler      = require('../utils/asyncHandler');
const insumoController  = require('../controllers/insumoController');
const insumoValidators  = require('../validators/insumoValidators');

const router = Router();
router.use(authRequired);

// Catálogo
router.get('/',     asyncHandler(insumoController.list));
router.post('/',    requireRole('admin','jefe'), validate(insumoValidators.create, 'body'),  asyncHandler(insumoController.crear));
router.patch('/:id',requireRole('admin','jefe'), validate(insumoValidators.update, 'body'),  asyncHandler(insumoController.actualizar));

// Por cita
router.get('/cita/:idCita',  asyncHandler(insumoController.listByCita));
router.post('/cita',         requireRole('trabajador','admin','jefe'),
  validate(insumoValidators.registrarInsumos, 'body'), asyncHandler(insumoController.registrar));
router.patch('/cita/:id',    requireRole('trabajador','admin','jefe'),
  validate(insumoValidators.updateCitaInsumo, 'body'), asyncHandler(insumoController.actualizarRegistro));

module.exports = router;
