'use strict';

const { Router } = require('express');

const auditController = require('../controllers/auditController');
const authRequired = require('../middlewares/authRequired');
const requireRole = require('../middlewares/requireRole');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

router.use(authRequired, requireRole('admin', 'jefe'));

router.get('/', asyncHandler(auditController.getLogs));

module.exports = router;
