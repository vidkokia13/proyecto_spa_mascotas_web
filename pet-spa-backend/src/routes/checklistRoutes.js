'use strict';

const { Router }           = require('express');
const authRequired         = require('../middlewares/authRequired');
const requireRole          = require('../middlewares/requireRole');
const validate             = require('../middlewares/validate');
const asyncHandler         = require('../utils/asyncHandler');
const checklistController  = require('../controllers/checklistController');
const checklistValidators  = require('../validators/checklistValidators');

const router = Router();
router.use(authRequired);

// Template items
router.get('/items',      asyncHandler(checklistController.listItems));
router.post('/items',     requireRole('admin','jefe'), validate(checklistValidators.createItem, 'body'),  asyncHandler(checklistController.createItem));
router.patch('/items/:id',requireRole('admin','jefe'), validate(checklistValidators.updateItem, 'body'),  asyncHandler(checklistController.updateItem));

// Cita checklist
router.get('/cita/:idCita', asyncHandler(checklistController.getCitaChecklist));
router.patch(
  '/cita/:idCita/item/:idItem',
  requireRole('trabajador','admin','jefe','recepcion'),
  validate(checklistValidators.toggleItem, 'body'),
  asyncHandler(checklistController.toggleItem),
);

module.exports = router;
