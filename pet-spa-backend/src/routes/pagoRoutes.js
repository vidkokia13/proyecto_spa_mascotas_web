'use strict';

const { Router }     = require('express');
const authRequired   = require('../middlewares/authRequired');
const requireRole    = require('../middlewares/requireRole');
const validate       = require('../middlewares/validate');
const asyncHandler   = require('../utils/asyncHandler');
const pagoController = require('../controllers/pagoController');
const pagoValidators = require('../validators/pagoValidators');

const router = Router();
router.use(authRequired);
router.use(requireRole('admin','jefe','recepcion'));

router.post('/',            validate(pagoValidators.create, 'body'),   asyncHandler(pagoController.registrar));
router.get('/cita/:idCita',                                             asyncHandler(pagoController.listByCita));
router.delete('/:id',       requireRole('admin','jefe'),               asyncHandler(pagoController.eliminar));

module.exports = router;
