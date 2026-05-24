'use strict';

const { Router }     = require('express');
const authRequired   = require('../middlewares/authRequired');
const requireRole    = require('../middlewares/requireRole');
const asyncHandler   = require('../utils/asyncHandler');
const fotoController = require('../controllers/fotoController');
const { upload }     = require('../middlewares/upload');

const router = Router();
router.use(authRequired);

router.get('/cita/:idCita',  asyncHandler(fotoController.list));
router.post(
  '/cita/:idCita',
  requireRole('trabajador','admin','jefe','recepcion'),
  upload.single('foto'),
  asyncHandler(fotoController.upload),
);
router.delete('/:id', requireRole('trabajador','admin','jefe'), asyncHandler(fotoController.remove));

module.exports = router;
