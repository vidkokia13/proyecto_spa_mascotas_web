'use strict';

const { Router } = require('express');

const authRoutes     = require('./authRoutes');
const employeeRoutes = require('./employeeRoutes');
const auditRoutes    = require('./auditRoutes');
const mascotaRoutes  = require('./mascotaRoutes');
const servicioRoutes = require('./servicioRoutes');
const horarioRoutes  = require('./horarioRoutes');
const agendaRoutes   = require('./agendaRoutes');
const citaRoutes     = require('./citaRoutes');

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

router.use('/auth',      authRoutes);
router.use('/empleados', employeeRoutes);
router.use('/audit-log', auditRoutes);
router.use('/mascotas',  mascotaRoutes);
router.use('/servicios', servicioRoutes);
router.use('/horarios',  horarioRoutes);
router.use('/agenda',    agendaRoutes);
router.use('/citas',     citaRoutes);

module.exports = router;
