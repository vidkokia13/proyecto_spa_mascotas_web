'use strict';

const { Router } = require('express');

const authRoutes     = require('./authRoutes');
const employeeRoutes = require('./employeeRoutes');
const auditRoutes    = require('./auditRoutes');

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

router.use('/auth',      authRoutes);
router.use('/empleados', employeeRoutes);
router.use('/audit-log', auditRoutes);

module.exports = router;
