'use strict';

const { Router }          = require('express');
const authRequired        = require('../middlewares/authRequired');
const requireRole         = require('../middlewares/requireRole');
const asyncHandler        = require('../utils/asyncHandler');
const notifController     = require('../controllers/notificacionController');

const router = Router();
router.use(authRequired);
router.use(requireRole('admin', 'jefe'));

router.get('/',       asyncHandler(notifController.listar));
router.get('/stats',  asyncHandler(notifController.stats));

module.exports = router;
