'use strict';

const { Router }   = require('express');
const authRequired = require('../middlewares/authRequired');
const requireRole  = require('../middlewares/requireRole');
const asyncHandler = require('../utils/asyncHandler');
const cajaController = require('../controllers/cajaController');

const router = Router();
router.use(authRequired);
router.use(requireRole('admin','jefe','recepcion'));

router.get('/resumen',   asyncHandler(cajaController.resumen));
router.get('/historial', asyncHandler(cajaController.historial));
router.post('/cerrar',   requireRole('admin','jefe'), asyncHandler(cajaController.cerrar));

module.exports = router;
