'use strict';

const db          = require('../config/db');
const logger      = require('../config/logger');
const notifRepo   = require('../repositories/notificacionRepository');
const notifSvc    = require('../services/notificationService');

async function listar(req, res) {
  const { tipo, fecha } = req.query;
  const limit  = Math.min(parseInt(req.query.limit  || '50'), 200);
  const offset = parseInt(req.query.offset || '0');

  const [notificaciones, total] = await Promise.all([
    notifRepo.findAll({ tipo, fecha, limit, offset }),
    notifRepo.countAll({ tipo, fecha }),
  ]);

  res.json({ notificaciones, total, limit, offset });
}

async function stats(req, res) {
  const fecha = req.query.fecha || null;

  const [hoy, historico] = await Promise.all([
    notifRepo.statsPorTipo(fecha || new Date().toISOString().slice(0, 10)),
    notifRepo.totalHistorico(),
  ]);

  res.json({ fecha, hoy, historico });
}

/**
 * POST /notificaciones/test
 * Envía un email de prueba al admin y registra el resultado.
 * Devuelve info diagnóstica detallada.
 */
async function probar(req, res) {
  const resultado = {
    smtp: { ok: false, error: null, messageId: null },
    db:   { ok: false, error: null, tablaExiste: false },
  };

  // 1. Verificar tabla
  try {
    await notifRepo.countAll({});
    resultado.db.tablaExiste = true;
  } catch (e) {
    resultado.db.error = e.message;
    return res.json({ ok: false, resultado });
  }

  // 2. Obtener email del admin solicitante
  const adminEmail = req.user?.email ?? 'test@petspa.local';

  // 3. Enviar email de prueba directamente (sin fire-and-forget para capturar error)
  try {
    const nodemailer = require('nodemailer');
    const env        = require('../config/env');
    const transport  = nodemailer.createTransport({
      host:   env.mail.host,
      port:   env.mail.port,
      secure: env.mail.port === 465,
      auth:   { user: env.mail.user, pass: env.mail.password },
    });
    const info = await transport.sendMail({
      from:    env.mail.from,
      to:      adminEmail,
      subject: '✅ Prueba de notificaciones — Pet Spa',
      html: `
        <h2>¡Funciona!</h2>
        <p>Este es un email de prueba enviado desde el panel de notificaciones.</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CL')}</p>
        <p><strong>Host SMTP:</strong> ${env.mail.host}:${env.mail.port}</p>
      `,
    });
    resultado.smtp.ok        = true;
    resultado.smtp.messageId = info.messageId;
  } catch (e) {
    resultado.smtp.error = e.message;
  }

  // 4. Registrar en DB (solo si el email fue exitoso)
  if (resultado.smtp.ok) {
    try {
      await notifRepo.marcarEnviada('test', `test-${Date.now()}`, adminEmail);
      resultado.db.ok = true;
    } catch (e) {
      resultado.db.error = e.message;
    }
  }

  const todo_ok = resultado.smtp.ok && resultado.db.ok;
  res.json({ ok: todo_ok, resultado });
}

/**
 * POST /notificaciones/check-stock
 * Escanea todos los productos con stock ≤ stock_minimo y envía notificación
 * de bajo stock si no se envió una en las últimas 24 h.
 */
async function checkStock(req, res) {
  // Verificar tabla primero
  try { await notifRepo.countAll({}); }
  catch (e) {
    return res.status(500).json({ ok: false, error: 'Tabla notificaciones_enviadas no existe. Ejecuta 13_notificaciones.sql' });
  }

  let productosLow = [];
  try {
    // COALESCE(stock_minimo, 5): productos sin stock_minimo configurado usan 5 como umbral por defecto
    const { rows } = await db.query(
      `SELECT id_producto, nombre, stock,
              COALESCE(stock_minimo, 5) AS stock_minimo_efectivo, stock_minimo, categoria
       FROM productos
       WHERE activo = true
         AND stock <= COALESCE(stock_minimo, 5)
       ORDER BY stock ASC`,
    );
    productosLow = rows;
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }

  if (productosLow.length === 0) {
    return res.json({ ok: true, verificados: 0, enviados: 0, mensaje: 'No hay productos con stock bajo actualmente.' });
  }

  const admins = await notifRepo.getAdminEmails();

  if (admins.length === 0) {
    return res.json({
      ok: false,
      verificados: productosLow.length,
      enviados: 0,
      mensaje: 'No se encontraron usuarios admin/jefe activos para notificar. Verifica que existan y estén activos.',
    });
  }

  let enviados = 0;
  const errores = [];

  for (const p of productosLow) {
    const yaReciente = await notifRepo.bajoStockReciente(p.id_producto);
    if (yaReciente) continue;

    try {
      await notifSvc.notificarBajoStock(p, admins);
      // Solo marcar como enviado si el email realmente llegó (notificarBajoStock lanza si falla)
      await notifRepo.marcarEnviada('bajo_stock', String(p.id_producto), admins.map(a => a.email).join(', '));
      enviados++;
    } catch (err) {
      logger.error(`checkStock: error enviando notif para ${p.nombre}`, { error: err.message });
      errores.push({ producto: p.nombre, error: err.message });
    }
  }

  const response = {
    ok: errores.length === 0,
    verificados: productosLow.length,
    enviados,
    productos: productosLow.map(p => ({
      nombre: p.nombre,
      stock:  p.stock,
      minimo: p.stock_minimo_efectivo,
    })),
  };
  if (errores.length > 0) response.errores = errores;

  res.json(response);
}

module.exports = { listar, stats, probar, checkStock };
