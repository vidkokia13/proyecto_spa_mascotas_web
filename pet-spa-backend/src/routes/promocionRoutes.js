'use strict';

const { Router }          = require('express');
const authRequired        = require('../middlewares/authRequired');
const requireRole         = require('../middlewares/requireRole');
const validate            = require('../middlewares/validate');
const asyncHandler        = require('../utils/asyncHandler');
const promocionController = require('../controllers/promocionController');
const promocionValidators = require('../validators/promocionValidators');

const router = Router();
router.use(authRequired);

// Verificar código (recepcion, admin, jefe)
router.post('/verificar',
  requireRole('admin','jefe','recepcion'),
  validate(promocionValidators.verificar, 'body'),
  asyncHandler(promocionController.verificar),
);

// Listar (todos los roles internos)
router.get('/', requireRole('admin','jefe','recepcion'), asyncHandler(promocionController.listar));
router.get('/:id', requireRole('admin','jefe','recepcion'), validate(promocionValidators.idParam, 'params'), asyncHandler(promocionController.getOne));

// CRUD solo admin/jefe
router.post('/',     requireRole('admin','jefe'), validate(promocionValidators.create, 'body'), asyncHandler(promocionController.crear));
router.patch('/:id', requireRole('admin','jefe'), validate(promocionValidators.idParam, 'params'), validate(promocionValidators.update, 'body'), asyncHandler(promocionController.actualizar));
router.delete('/:id',requireRole('admin','jefe'), validate(promocionValidators.idParam, 'params'), asyncHandler(promocionController.eliminar));

module.exports = router;
