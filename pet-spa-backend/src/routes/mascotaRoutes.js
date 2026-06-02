'use strict';

const { Router }          = require('express');
const authRequired        = require('../middlewares/authRequired');
const validate            = require('../middlewares/validate');
const asyncHandler        = require('../utils/asyncHandler');
const mascotaController   = require('../controllers/mascotaController');
const mascotaValidators   = require('../validators/mascotaValidators');
const { uploadCarnet, uploadMascota } = require('../middlewares/upload');
const requireRole         = require('../middlewares/requireRole');

const router = Router();
router.use(authRequired);

router.get('/',      asyncHandler(mascotaController.listar));
router.get('/:id',   validate(mascotaValidators.idParam, 'params'), asyncHandler(mascotaController.getOne));
router.post('/',     validate(mascotaValidators.create,  'body'),   asyncHandler(mascotaController.crear));
router.patch('/:id', validate(mascotaValidators.idParam, 'params'), validate(mascotaValidators.update, 'body'), asyncHandler(mascotaController.actualizar));
router.delete('/:id',validate(mascotaValidators.idParam, 'params'), asyncHandler(mascotaController.eliminar));

// Carnet de vacunas (imagen o PDF)
router.post('/:id/carnet', validate(mascotaValidators.idParam, 'params'), uploadCarnet.single('carnet'), asyncHandler(mascotaController.subirCarnet));

// Foto de perfil de mascota — solo admin/jefe
router.post('/:id/foto',
  requireRole(['admin', 'jefe']),
  validate(mascotaValidators.idParam, 'params'),
  uploadMascota.single('foto'),
  asyncHandler(mascotaController.subirFoto),
);
router.delete('/:id/foto',
  requireRole(['admin', 'jefe']),
  validate(mascotaValidators.idParam, 'params'),
  asyncHandler(mascotaController.eliminarFoto),
);

module.exports = router;
