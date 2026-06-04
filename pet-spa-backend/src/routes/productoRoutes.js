'use strict';

const { Router }            = require('express');
const authRequired          = require('../middlewares/authRequired');
const requireRole           = require('../middlewares/requireRole');
const validate              = require('../middlewares/validate');
const asyncHandler          = require('../utils/asyncHandler');
const productoController    = require('../controllers/productoController');
const productoValidators    = require('../validators/productoValidators');
const { uploadProducto }    = require('../middlewares/upload');

const router = Router();
router.use(authRequired);

const soloJefeAdmin = requireRole('admin', 'jefe');

// Cualquier usuario autenticado puede listar y ver productos
router.get('/',    asyncHandler(productoController.listar));
router.get('/:id', validate(productoValidators.idParam, 'params'), asyncHandler(productoController.getOne));

// Solo admin/jefe: crear, editar, eliminar productos e imágenes
router.post('/',
  soloJefeAdmin,
  uploadProducto.single('imagen'),
  validate(productoValidators.create, 'body'),
  asyncHandler(productoController.crear),
);

router.patch('/:id',
  soloJefeAdmin,
  validate(productoValidators.idParam, 'params'),
  uploadProducto.single('imagen'),
  validate(productoValidators.update, 'body'),
  asyncHandler(productoController.actualizar),
);

router.delete('/:id/imagen',
  soloJefeAdmin,
  validate(productoValidators.idParam, 'params'),
  asyncHandler(productoController.eliminarImagen),
);

router.delete('/:id',
  soloJefeAdmin,
  validate(productoValidators.idParam, 'params'),
  asyncHandler(productoController.eliminar),
);

module.exports = router;
