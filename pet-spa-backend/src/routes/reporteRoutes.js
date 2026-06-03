'use strict';

const { Router }  = require('express');
const auth        = require('../middlewares/authRequired');
const role        = require('../middlewares/requireRole');
const handler     = require('../utils/asyncHandler');
const ctrl        = require('../controllers/reporteController');

const router = Router();
router.use(auth);

// ── Admin / Jefe ─────────────────────────────────────────────────────────────
router.get('/ventas',        role('admin','jefe'),                              handler(ctrl.ventas));
router.get('/ocupacion',     role('admin','jefe'),                              handler(ctrl.ocupacion));
router.get('/nps',           role('admin','jefe'),                              handler(ctrl.nps));

// ── Recepción (también admin/jefe) ───────────────────────────────────────────
router.get('/cronograma',    role('admin','jefe','recepcion'),                  handler(ctrl.cronograma));
router.get('/cancelaciones', role('admin','jefe','recepcion'),                  handler(ctrl.reporteCancelaciones));

// ── Groomer (también admin/jefe pueden ver con ?id_trabajador) ───────────────
router.get('/productividad', role('admin','jefe','trabajador'),                 handler(ctrl.productividad));
router.get('/mis-insumos',   role('trabajador'),                                handler(ctrl.misInsumos));

// ── Cliente ──────────────────────────────────────────────────────────────────
router.get('/historial-clinico', role('cliente'),                               handler(ctrl.historialClinico));
router.get('/mis-promociones',   role('cliente'),                               handler(ctrl.misPromociones));

// ── Calificaciones (acceso amplio: cliente crea, todos pueden consultar) ─────
router.post('/calificaciones',          role('cliente'),                        handler(ctrl.crearCalificacion));
router.get('/calificaciones/cita/:id',  role('admin','jefe','recepcion','trabajador','cliente'), handler(ctrl.getCalificacion));

module.exports = router;
