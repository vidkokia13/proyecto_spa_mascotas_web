'use strict';

const { Router }       = require('express');
const authRequired     = require('../middlewares/authRequired');
const requireRole      = require('../middlewares/requireRole');
const validate         = require('../middlewares/validate');
const asyncHandler     = require('../utils/asyncHandler');
const agendaController = require('../controllers/agendaController');
const citaValidators   = require('../validators/citaValidators');
const bloqueoValidators= require('../validators/bloqueoValidators');

const router = Router();
router.use(authRequired);

// Available slots query (all authenticated users)
router.get('/slots', validate(citaValidators.getSlotsQuery, 'query'), asyncHandler(agendaController.getSlots));

// Active groomers list (all authenticated users — used by booking flow)
router.get('/groomers', asyncHandler(agendaController.getGroomers));

// Blockouts
router.get('/bloqueos',     requireRole('admin','jefe','recepcion'), asyncHandler(agendaController.getBloqueos));
router.post('/bloqueos',    requireRole('admin','jefe'), validate(bloqueoValidators.create, 'body'), asyncHandler(agendaController.crearBloqueo));
router.delete('/bloqueos/:id', requireRole('admin','jefe'), validate(bloqueoValidators.idParam, 'params'), asyncHandler(agendaController.eliminarBloqueo));

module.exports = router;
