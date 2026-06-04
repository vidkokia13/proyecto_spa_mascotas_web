'use strict';

const cron       = require('node-cron');
const logger     = require('../config/logger');
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

  logger.info('📅 Scheduler de recordatorios iniciado (24h cada 30 min · 2h cada 15 min)');
}

module.exports = { iniciarScheduler, procesarRecordatorios24h, procesarRecordatorios2h };
