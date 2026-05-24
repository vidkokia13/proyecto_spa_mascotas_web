'use strict';

const { Router } = require('express');

const authRoutes      = require('./authRoutes');
const employeeRoutes  = require('./employeeRoutes');
const auditRoutes     = require('./auditRoutes');
const mascotaRoutes   = require('./mascotaRoutes');
const servicioRoutes  = require('./servicioRoutes');
const horarioRoutes   = require('./horarioRoutes');
const agendaRoutes    = require('./agendaRoutes');
const citaRoutes      = require('./citaRoutes');
const pagoRoutes      = require('./pagoRoutes');
const fichaRoutes     = require('./fichaRoutes');
const checklistRoutes = require('./checklistRoutes');
const fotoRoutes      = require('./fotoRoutes');
const insumoRoutes    = require('./insumoRoutes');
const promocionRoutes = require('./promocionRoutes');
const cajaRoutes      = require('./cajaRoutes');

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
router.use('/pagos',     pagoRoutes);
router.use('/fichas',    fichaRoutes);
router.use('/checklist', checklistRoutes);
router.use('/fotos',     fotoRoutes);
router.use('/insumos',    insumoRoutes);
router.use('/promociones', promocionRoutes);
router.use('/caja',       cajaRoutes);

module.exports = router;
