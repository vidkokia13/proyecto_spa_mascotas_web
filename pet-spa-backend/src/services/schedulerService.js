'use strict';

const cron       = require('node-cron');
const logger     = require('../config/logger');
const db         = require('../config/db');
const notifRepo  = require('../repositories/notificacionRepository');
const notifSvc   = require('./notificationService');

async function procesarRecordatorios24h() {
  const citas = await notifRepo.citasPendientes24h();
  let enviados = 0;
  for (const cita of citas) {
    const ya = await notifRepo.yaEnviadaRecordatorio('recordatorio_24h', String(cita.id_cita));
    if (ya) continue;
    await notifSvc.notificarRecordatorio24h(cita);
    await notifRepo.marcarEnviada('recordatorio_24h', String(cita.id_cita), cita.email_cliente);
    enviados++;
  }
  if (enviados > 0) logger.info(`Recordatorios 24h enviados: ${enviados}`);
}

async function procesarRecordatorios2h() {
  const citas = await notifRepo.citasPendientes2h();
  let enviados = 0;
  for (const cita of citas) {
    const ya = await notifRepo.yaEnviadaRecordatorio('recordatorio_2h', String(cita.id_cita));
    if (ya) continue;
    await notifSvc.notificarRecordatorio2h(cita);
    await notifRepo.marcarEnviada('recordatorio_2h', String(cita.id_cita), cita.email_cliente);
    enviados++;
  }
  if (enviados > 0) logger.info(`Recordatorios 2h enviados: ${enviados}`);
}

async function verificarStockBajo() {
  let productosLow;
  try {
    const { rows } = await db.query(
      `SELECT id_producto, nombre, stock,
              COALESCE(stock_minimo, 5) AS stock_minimo_efectivo, stock_minimo, categoria
       FROM productos
       WHERE activo = true
         AND stock <= COALESCE(stock_minimo, 5)
       ORDER BY stock ASC`,
    );
    productosLow = rows;
  } catch (err) {
    logger.error('Scheduler stock: error consultando productos', { error: err.message });
    return;
  }

  if (!productosLow.length) return;

  let admins;
  try {
    admins = await notifRepo.getAdminEmails();
  } catch (err) {
    logger.error('Scheduler stock: error obteniendo admins', { error: err.message });
    return;
  }

  if (!admins.length) return;

  let enviados = 0;
  for (const p of productosLow) {
    const yaReciente = await notifRepo.bajoStockReciente(p.id_producto).catch(() => false);
    if (yaReciente) continue;
    try {
      await notifSvc.notificarBajoStock(p, admins);
      await notifRepo.marcarEnviada('bajo_stock', String(p.id_producto), admins.map(a => a.email).join(', '));
      enviados++;
    } catch (err) {
      logger.error(`Scheduler stock: error notificando ${p.nombre}`, { error: err.message });
    }
  }
  if (enviados > 0) logger.info(`Scheduler stock: ${enviados} alerta(s) de bajo stock enviadas`);
}

function iniciarScheduler() {
  // Recordatorio 24 h — corre cada 30 minutos
  cron.schedule('*/30 * * * *', async () => {
    try { await procesarRecordatorios24h(); }
    catch (err) { logger.error('Error en scheduler 24h', { error: err.message }); }
  });

  // Recordatorio 2 h — corre cada 15 minutos
  cron.schedule('*/15 * * * *', async () => {
    try { await procesarRecordatorios2h(); }
    catch (err) { logger.error('Error en scheduler 2h', { error: err.message }); }
  });

  // Verificación de stock bajo — corre cada hora en el minuto 0
  cron.schedule('0 * * * *', async () => {
    try { await verificarStockBajo(); }
    catch (err) { logger.error('Error en scheduler stock', { error: err.message }); }
  });

  logger.info('📅 Scheduler iniciado (recordatorios 24h/2h · stock bajo cada hora)');
}

module.exports = { iniciarScheduler, procesarRecordatorios24h, procesarRecordatorios2h, verificarStockBajo };
