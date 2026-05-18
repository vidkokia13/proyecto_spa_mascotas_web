'use strict';

const db = require('../config/db');
const userRepo = require('../repositories/userRepository');
const workerRepo = require('../repositories/workerRepository');
const roleRepo = require('../repositories/roleRepository');
const auditService = require('./auditService');
const { hashPassword } = require('../utils/password');
const AppError = require('../utils/AppError');

const ROLES_INTERNOS = ['trabajador', 'admin', 'jefe'];

async function createEmployee(payload, actor, ctx = {}) {
  if (!ROLES_INTERNOS.includes(payload.rol)) {
    throw new AppError(
      `Rol inválido. Permitidos: ${ROLES_INTERNOS.join(', ')}`,
      400,
      'INVALID_ROLE',
    );
  }

  if (await userRepo.emailExists(payload.email)) {
    throw new AppError('El email ya está registrado', 409, 'EMAIL_TAKEN');
  }

  const rol = await roleRepo.findByName(payload.rol);
  if (!rol) {
    throw new AppError(`Rol "${payload.rol}" no existe en la BD`, 500, 'MISSING_ROLE');
  }

  const passwordHash = await hashPassword(payload.password);

  const result = await db.withTransaction(async (client) => {
    const user = await userRepo.create({
      idRol: rol.id_rol,
      nombre: payload.nombre,
      email: payload.email,
      passwordHash,
      estado: 'activo',
      forcePasswordChange: true, // primer login → cambiar contraseña
    }, client);

    const worker = await workerRepo.create({
      idUsuario: user.id_usuario,
      sueldoMensual: payload.sueldoMensual,
      activo: payload.activo ?? true,
      turno: payload.turno,
      telefono: payload.telefono,
      especialidad: payload.especialidad,
      capacidadSimultanea: payload.capacidadSimultanea,
    }, client);

    await auditService.log({
      idUsuario: actor.id_usuario,
      accion: 'EMPLOYEE_CREATE',
      detalle: `Empleado creado: ${user.email} (rol=${payload.rol}, id_trabajador=${worker.id_trabajador})`,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    }, client);

    return { user, worker };
  });

  return {
    id_usuario:    result.user.id_usuario,
    id_trabajador: result.worker.id_trabajador,
    nombre:        result.user.nombre,
    email:         result.user.email,
    rol:           payload.rol,
    estado:        result.user.estado,
    turno:         result.worker.turno,
    especialidad:  result.worker.especialidad,
    activo:        result.worker.activo,
    force_password_change: true,
  };
}

async function listEmployees() {
  return workerRepo.listAll();
}

async function getEmployee(idUsuario) {
  const emp = await workerRepo.findDetailedByUserId(idUsuario);
  if (!emp) throw new AppError('Empleado no encontrado', 404, 'EMPLOYEE_NOT_FOUND');
  return emp;
}

async function updateEmployee(idUsuario, payload, actor, ctx = {}) {
  const existing = await workerRepo.findDetailedByUserId(idUsuario);
  if (!existing) throw new AppError('Empleado no encontrado', 404, 'EMPLOYEE_NOT_FOUND');

  await db.withTransaction(async (client) => {
    if (payload.estado !== undefined) {
      await userRepo.updateEstado(idUsuario, payload.estado, client);
    }

    const workerFields = {
      turno: payload.turno,
      especialidad: payload.especialidad,
      activo: payload.activo,
      telefono: payload.telefono,
      sueldoMensual: payload.sueldoMensual,
      capacidadSimultanea: payload.capacidadSimultanea,
    };
    if (Object.values(workerFields).some((v) => v !== undefined)) {
      await workerRepo.updateByUserId(idUsuario, workerFields, client);
    }

    await auditService.log({
      idUsuario: actor.id_usuario,
      accion: 'EMPLOYEE_UPDATE',
      detalle: `Empleado actualizado: id_usuario=${idUsuario} cambios=${JSON.stringify(payload)}`,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    }, client);
  });

  return workerRepo.findDetailedByUserId(idUsuario);
}

module.exports = { createEmployee, listEmployees, getEmployee, updateEmployee };
