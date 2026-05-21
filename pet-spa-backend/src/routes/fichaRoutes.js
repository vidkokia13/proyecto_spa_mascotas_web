'use strict';

const { Router }      = require('express');
const authRequired    = require('../middlewares/authRequired');
const requireRole     = require('../middlewares/requireRole');
const validate        = require('../middlewares/validate');
const asyncHandler    = require('../utils/asyncHandler');
const fichaController = require('../controllers/fichaController');
const fichaValidators = require('../validators/fichaValidators');

const router = Router();
router.use(authRequired);

router.get('/cita/:idCita', asyncHandler(fichaController.get));
router.post('/', requireRole('trabajador','admin','jefe'), validate(fichaValidators.save, 'body'), asyncHandler(fichaController.save));

module.exports = router;
