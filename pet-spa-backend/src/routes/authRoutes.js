'use strict';

const { Router } = require('express');
const rateLimit = require('express-rate-limit');

const authController = require('../controllers/authController');
const authRequired = require('../middlewares/authRequired');
const requireRole = require('../middlewares/requireRole');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { register, login, changePassword, verify2FA, verifySetup2FA } = require('../validators/authValidators');

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Demasiados intentos, probá más tarde.', code: 'RATE_LIMITED' } },
});

// Públicas
router.post('/register', validate(register, 'body'), asyncHandler(authController.register));
router.post('/login', loginLimiter, validate(login, 'body'), asyncHandler(authController.login));
router.get('/activate', asyncHandler(authController.activate));
router.post('/2fa/login', validate(verify2FA, 'body'), asyncHandler(authController.verify2FALogin));

// Autenticadas
router.get('/me', authRequired, asyncHandler(authController.me));
router.patch('/change-password', authRequired, validate(changePassword, 'body'), asyncHandler(authController.changePassword));

// 2FA setup (solo admin y jefe)
router.post('/2fa/setup', authRequired, requireRole('admin', 'jefe'), asyncHandler(authController.setup2FA));
router.post('/2fa/verify-setup', authRequired, requireRole('admin', 'jefe'), validate(verifySetup2FA, 'body'), asyncHandler(authController.verifySetup2FA));
router.delete('/2fa', authRequired, requireRole('admin', 'jefe'), asyncHandler(authController.disable2FA));

module.exports = router;
