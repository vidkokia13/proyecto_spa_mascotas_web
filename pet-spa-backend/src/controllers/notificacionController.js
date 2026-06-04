'use strict';

const db          = require('../config/db');
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
    const { rows } = await db.query(
      `SELECT id_producto, nombre, stock, stock_minimo, categoria
       FROM productos
       WHERE activo = true AND stock <= stock_minimo
       ORDER BY stock ASC`,
    );
    productosLow = rows;
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }

  if (productosLow.length === 0) {
    return res.json({ ok: true, verificados: 0, enviados: 0, mensaje: 'No hay productos con stock bajo.' });
  }

  const admins = await notifRepo.getAdminEmails();
  let enviados = 0;

  for (const p of productosLow) {
    const yaReciente = await notifRepo.bajoStockReciente(p.id_producto);
    if (yaReciente) continue;
    await notifSvc.notificarBajoStock(p, admins);
    await notifRepo.marcarEnviada('bajo_stock', String(p.id_producto), admins.map(a => a.email).join(', '));
    enviados++;
  }

  res.json({
    ok: true,
    verificados: productosLow.length,
    enviados,
    productos: productosLow.map(p => ({ nombre: p.nombre, stock: p.stock, minimo: p.stock_minimo })),
  });
}

module.exports = { listar, stats, probar, checkStock };
