'use strict';

const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const db = require('../config/db');
const userRepo = require('../repositories/userRepository');
const clientRepo = require('../repositories/clientRepository');
const roleRepo = require('../repositories/roleRepository');
const auditService = require('./auditService');
const mailService = require('./mailService');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const env = require('../config/env');
const logger = require('../config/logger');

// speakeasy window: tolera 1 paso de drift (~30 s cada lado)

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildTokenPayload(profile) {
  return {
    id_usuario:    profile.id_usuario,
    id_rol:        profile.id_rol,
    rol:           profile.rol,
    id_cliente:    profile.id_cliente || null,
    id_trabajador: profile.id_trabajador || null,
  };
}

function buildUserResponse(profile) {
  return {
    id_usuario:    profile.id_usuario,
    nombre:        profile.nombre,
    email:         profile.email,
    rol:           profile.rol,
    id_cliente:    profile.id_cliente || null,
    id_trabajador: profile.id_trabajador || null,
  };
}

// ─── Registro de cliente ─────────────────────────────────────────────────────

async function registerCliente(payload, ctx = {}) {
  if (await userRepo.emailExists(payload.email)) {
    throw new AppError('El email ya está registrado', 409, 'EMAIL_TAKEN');
  }

  const rolCliente = await roleRepo.findByName('cliente');
  if (!rolCliente) {
    throw new AppError('Rol "cliente" no existe. Ejecutá sql/02_seed_roles.sql.', 500, 'MISSING_ROLE');
  }

  const passwordHash = await hashPassword(payload.password);

  const result = await db.withTransaction(async (client) => {
    const user = await userRepo.create({
      idRol: rolCliente.id_rol,
      nombre: payload.nombre,
      email: payload.email,
      passwordHash,
      estado: 'pendiente', // activa tras click en correo
      forcePasswordChange: false,
    }, client);

    const cliente = await clientRepo.create({
      idUsuario: user.id_usuario,
      telefono: payload.telefono,
      direccion: payload.direccion,
      ci: payload.ci,
      canalNotificacion: payload.canalNotificacion,
      horariosPreferidos: payload.horariosPreferidos,
    }, client);

    await auditService.log({
      idUsuario: user.id_usuario,
      accion: 'USER_REGISTER',
      detalle: `Auto-registro de cliente ${user.email}`,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    }, client);

    return { user, cliente };
  });

  const activationToken = mailService.generateActivationToken(result.user.id_usuario);
  mailService.sendActivationEmail(
    { nombre: result.user.nombre, email: result.user.email },
    activationToken,
  ).catch((err) => logger.error('Error en sendActivationEmail', { error: err.message }));

  return {
    id_usuario: result.user.id_usuario,
    id_cliente: result.cliente.id_cliente,
    nombre: result.user.nombre,
    email: result.user.email,
    estado: result.user.estado,
    rol: 'cliente',
  };
}

// ─── Activación de cuenta ────────────────────────────────────────────────────

async function activateAccount(token, ctx = {}) {
  let decoded;
  try {
    decoded = jwt.verify(token, env.jwt.secret);
  } catch {
    throw new AppError('El enlace de activación es inválido o expiró.', 400, 'INVALID_TOKEN');
  }

  if (decoded.purpose !== 'account_activation') {
    throw new AppError('Token inválido.', 400, 'INVALID_TOKEN');
  }

  const user = await userRepo.findById(decoded.sub);
  if (!user) throw new AppError('Usuario no encontrado.', 404, 'USER_NOT_FOUND');

  if (user.estado === 'activo') {
    return { message: 'La cuenta ya estaba activada. Podés iniciar sesión.' };
  }

  await userRepo.updateEstado(decoded.sub, 'activo');
  await auditService.log({
    idUsuario: decoded.sub,
    accion: 'ACCOUNT_ACTIVATED',
    detalle: `Cuenta activada para ${user.email}`,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { message: 'Cuenta activada exitosamente. Ya podés iniciar sesión.' };
}

// ─── Login ───────────────────────────────────────────────────────────────────

async function login(payload, ctx = {}) {
  const generic = new AppError('Credenciales inválidas', 401, 'INVALID_CREDENTIALS');

  const user = await userRepo.findByEmail(payload.email);
  if (!user) throw generic;

  // Bloqueo por intentos fallidos
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const mins = Math.ceil((new Date(user.locked_until) - Date.now()) / 60000);
    throw new AppError(
      `Cuenta bloqueada. Intentá de nuevo en ${mins} minuto(s).`,
      423,
      'ACCOUNT_LOCKED',
    );
  }

  const ok = await verifyPassword(payload.password, user.password_hash);
  if (!ok) {
    const attempts = (user.failed_attempts || 0) + 1;
    if (attempts >= 5) {
      const until = new Date(Date.now() + 30 * 60 * 1000);
      await userRepo.lockAccount(user.id_usuario, until);
      await auditService.log({
        idUsuario: user.id_usuario,
        accion: 'ACCOUNT_LOCKED',
        detalle: `Cuenta bloqueada por 30 min tras 5 intentos fallidos`,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
      throw new AppError('Cuenta bloqueada por 30 minutos tras 5 intentos fallidos.', 423, 'ACCOUNT_LOCKED');
    }
    await userRepo.incrementFailedAttempts(user.id_usuario);
    throw generic;
  }

  if (user.estado === 'pendiente') {
    throw new AppError(
      'Tu cuenta está pendiente de activación. Revisá tu correo electrónico.',
      403,
      'ACCOUNT_PENDING',
    );
  }

  if (user.estado !== 'activo') {
    throw new AppError('La cuenta está inactiva. Contactá al administrador.', 403, 'ACCOUNT_INACTIVE');
  }

  await userRepo.resetFailedAttempts(user.id_usuario);

  // 2FA challenge (solo si está habilitado Y configurado)
  if (user.two_factor_enabled && user.two_factor_secret) {
    const twoFaToken = jwt.sign(
      { id_usuario: user.id_usuario, purpose: '2fa_challenge' },
      env.jwt.secret,
      { expiresIn: '5m' },
    );
    return { requires_2fa: true, two_factor_token: twoFaToken };
  }

  const profile = await userRepo.findByIdWithProfile(user.id_usuario);
  userRepo.updateLastAccess(user.id_usuario, ctx.ip, ctx.userAgent).catch(() => {});

  await auditService.log({
    idUsuario: user.id_usuario,
    accion: 'LOGIN',
    detalle: `Login exitoso (rol=${profile.rol})`,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  const token = signToken(buildTokenPayload(profile));
  return {
    token,
    force_password_change: profile.force_password_change || false,
    user: buildUserResponse(profile),
  };
}

// ─── Verificación 2FA en login ───────────────────────────────────────────────

async function verifyLogin2FA(twoFaToken, code, ctx = {}) {
  let decoded;
  try {
    decoded = jwt.verify(twoFaToken, env.jwt.secret);
  } catch {
    throw new AppError('Sesión 2FA expirada. Volvé a iniciar sesión.', 401, 'INVALID_TOKEN');
  }

  if (decoded.purpose !== '2fa_challenge') {
    throw new AppError('Token inválido.', 401, 'INVALID_TOKEN');
  }

  const user = await userRepo.findById(decoded.id_usuario);
  if (!user || !user.two_factor_secret) {
    throw new AppError('Usuario no encontrado o 2FA no configurado.', 400, 'INVALID_REQUEST');
  }

  const valid = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: 'base32',
    token: code,
    window: 1,
  });
  if (!valid) {
    throw new AppError('Código 2FA incorrecto.', 400, 'INVALID_2FA_CODE');
  }

  const profile = await userRepo.findByIdWithProfile(decoded.id_usuario);
  userRepo.updateLastAccess(decoded.id_usuario, ctx.ip, ctx.userAgent).catch(() => {});

  await auditService.log({
    idUsuario: decoded.id_usuario,
    accion: 'LOGIN_2FA',
    detalle: 'Login completado con 2FA',
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  const token = signToken(buildTokenPayload(profile));
  return {
    token,
    force_password_change: profile.force_password_change || false,
    user: buildUserResponse(profile),
  };
}

// ─── Cambio de contraseña ────────────────────────────────────────────────────

async function changePassword(idUsuario, currentPassword, newPassword, ctx = {}) {
  const user = await userRepo.findById(idUsuario);
  if (!user) throw new AppError('Usuario no encontrado.', 404, 'USER_NOT_FOUND');

  const ok = await verifyPassword(currentPassword, user.password_hash);
  if (!ok) throw new AppError('La contraseña actual es incorrecta.', 401, 'WRONG_PASSWORD');

  if (currentPassword === newPassword) {
    throw new AppError('La nueva contraseña debe ser diferente a la actual.', 400, 'SAME_PASSWORD');
  }

  const newHash = await hashPassword(newPassword);
  await userRepo.updatePassword(idUsuario, newHash);
  await userRepo.setForcePasswordChange(idUsuario, false);

  await auditService.log({
    idUsuario,
    accion: 'PASSWORD_CHANGE',
    detalle: 'Usuario cambió su contraseña',
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

// ─── 2FA setup (configurar) ──────────────────────────────────────────────────

async function setup2FA(idUsuario) {
  const user = await userRepo.findById(idUsuario);
  if (!user) throw new AppError('Usuario no encontrado.', 404, 'USER_NOT_FOUND');

  const secretObj = speakeasy.generateSecret({ length: 20, name: `PetSpa:${user.email}` });
  const qrDataUrl = await qrcode.toDataURL(secretObj.otpauth_url);

  await userRepo.set2FASecret(idUsuario, secretObj.base32);

  return { secret: secretObj.base32, qrDataUrl };
}

async function verifySetup2FA(idUsuario, code) {
  const user = await userRepo.findById(idUsuario);
  if (!user || !user.two_factor_secret) {
    throw new AppError('2FA no iniciado. Llamá a /setup primero.', 400, 'INVALID_REQUEST');
  }

  const valid = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: 'base32',
    token: code,
    window: 1,
  });
  if (!valid) throw new AppError('Código inválido. Intentá de nuevo.', 400, 'INVALID_2FA_CODE');

  await userRepo.enable2FA(idUsuario);

  await auditService.log({
    idUsuario,
    accion: '2FA_ENABLED',
    detalle: '2FA activado para el usuario',
  });

  return { message: '2FA activado correctamente.' };
}

async function disable2FA(idUsuario, ctx = {}) {
  await userRepo.disable2FA(idUsuario);
  await auditService.log({
    idUsuario,
    accion: '2FA_DISABLED',
    detalle: '2FA desactivado',
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
  return { message: '2FA desactivado.' };
}

// ─── Perfil ──────────────────────────────────────────────────────────────────

async function getProfile(idUsuario) {
  const profile = await userRepo.findByIdWithProfile(idUsuario);
  if (!profile) throw new AppError('Usuario no encontrado.', 404, 'USER_NOT_FOUND');
  return profile;
}

module.exports = {
  registerCliente,
  activateAccount,
  login,
  verifyLogin2FA,
  changePassword,
  setup2FA,
  verifySetup2FA,
  disable2FA,
  getProfile,
};
