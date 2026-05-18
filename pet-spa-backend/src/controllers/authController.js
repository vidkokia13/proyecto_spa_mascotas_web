'use strict';

const authService = require('../services/authService');

function getCtx(req) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] || null };
}

async function register(req, res) {
  const created = await authService.registerCliente(req.body, getCtx(req));
  res.status(201).json({
    message: 'Cuenta creada. Revisá tu correo para activarla (enlace válido 15 minutos).',
    user: created,
  });
}

async function login(req, res) {
  const result = await authService.login(req.body, getCtx(req));
  if (result.requires_2fa) {
    return res.json({ requires_2fa: true, two_factor_token: result.two_factor_token });
  }
  res.json({ token: result.token, force_password_change: result.force_password_change, user: result.user });
}

async function activate(req, res) {
  const result = await authService.activateAccount(req.query.token, getCtx(req));
  res.json(result);
}

async function me(req, res) {
  const profile = await authService.getProfile(req.user.id_usuario);
  res.json({ user: profile });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id_usuario, currentPassword, newPassword, getCtx(req));
  res.json({ message: 'Contraseña actualizada correctamente.' });
}

async function verify2FALogin(req, res) {
  const { two_factor_token, code } = req.body;
  const result = await authService.verifyLogin2FA(two_factor_token, code, getCtx(req));
  res.json({ token: result.token, force_password_change: result.force_password_change, user: result.user });
}

async function setup2FA(req, res) {
  const result = await authService.setup2FA(req.user.id_usuario);
  res.json(result);
}

async function verifySetup2FA(req, res) {
  const result = await authService.verifySetup2FA(req.user.id_usuario, req.body.code);
  res.json(result);
}

async function disable2FA(req, res) {
  const result = await authService.disable2FA(req.user.id_usuario, getCtx(req));
  res.json(result);
}

module.exports = {
  register,
  login,
  activate,
  me,
  changePassword,
  verify2FALogin,
  setup2FA,
  verifySetup2FA,
  disable2FA,
};
