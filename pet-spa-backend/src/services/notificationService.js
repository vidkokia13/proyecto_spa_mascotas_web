'use strict';

const nodemailer  = require('nodemailer');
const env         = require('../config/env');
const logger      = require('../config/logger');
const notifRepo   = require('../repositories/notificacionRepository');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   env.mail.host,
      port:   env.mail.port,
      secure: env.mail.port === 465,
      auth:   { user: env.mail.user, pass: env.mail.password },
    });
  }
  return transporter;
}

/**
 * Envía un email y lo registra en notificaciones_enviadas.
 * @param {object} mail   - { to, subject, html }
 * @param {object} [log]  - { tipo, referenciaId } para guardar en BD
 */
async function sendMail({ to, subject, html }, log = null) {
  try {
    const info = await getTransporter().sendMail({
      from: env.mail.from,
      to,
      subject,
      html,
    });
    logger.info(`Email enviado a ${to}: ${info.messageId}`);
  } catch (err) {
    logger.error('Error enviando email', { to, subject, error: err.message });
  }

  // Registrar siempre en notificaciones_enviadas, aunque el email falle
  if (log?.tipo && log?.referenciaId) {
    notifRepo.marcarEnviada(log.tipo, String(log.referenciaId), to).catch((e) =>
      logger.error('Error registrando notificacion', { error: e.message }),
    );
  }
}

// ── Templates de citas ────────────────────────────────────────────────────────

async function notificarCitaConfirmada({ email, nombreCliente, nombreMascota, nombreServicio, fechaHoraInicio, idCita = null }) {
  const fecha = new Date(fechaHoraInicio).toLocaleString('es-CL', { dateStyle: 'full', timeStyle: 'short' });
  await sendMail({
    to: email,
    subject: '✅ Tu cita ha sido confirmada — Pet Spa',
    html: `
      <h2>Hola ${nombreCliente},</h2>
      <p>Tu cita ha sido <strong>confirmada</strong>.</p>
      <ul>
        <li><strong>Mascota:</strong> ${nombreMascota}</li>
        <li><strong>Servicio:</strong> ${nombreServicio}</li>
        <li><strong>Fecha y hora:</strong> ${fecha}</li>
      </ul>
      <p>Te esperamos en el spa. ¡Hasta pronto!</p>
    `,
  }, { tipo: 'cita_confirmada', referenciaId: idCita });
}

async function notificarCitaCancelada({ email, nombreCliente, nombreMascota, nombreServicio, fechaHoraInicio, idCita = null }) {
  const fecha = new Date(fechaHoraInicio).toLocaleString('es-CL', { dateStyle: 'full', timeStyle: 'short' });
  await sendMail({
    to: email,
    subject: '❌ Tu cita ha sido cancelada — Pet Spa',
    html: `
      <h2>Hola ${nombreCliente},</h2>
      <p>Lamentamos informarte que tu cita ha sido <strong>cancelada</strong>.</p>
      <ul>
        <li><strong>Mascota:</strong> ${nombreMascota}</li>
        <li><strong>Servicio:</strong> ${nombreServicio}</li>
        <li><strong>Fecha y hora:</strong> ${fecha}</li>
      </ul>
      <p>Si deseas reagendar, ingresa a tu cuenta o contáctanos.</p>
    `,
  }, { tipo: 'cita_cancelada', referenciaId: idCita });
}

async function notificarCitaCompletada({ email, nombreCliente, nombreMascota, nombreServicio, recomendaciones = null, idCita = null }) {
  const seccionRecomendaciones = recomendaciones
    ? `<p><strong>Recomendaciones del groomer:</strong></p><blockquote style="border-left:4px solid #7c3aed;padding-left:12px;color:#555">${recomendaciones}</blockquote>`
    : '';
  await sendMail({
    to: email,
    subject: '🐾 El servicio de tu mascota finalizó — Pet Spa',
    html: `
      <h2>Hola ${nombreCliente},</h2>
      <p>El servicio de <strong>${nombreMascota}</strong> (<em>${nombreServicio}</em>) ha sido <strong>completado</strong>.</p>
      <p>¡Tu mascota está lista para ser recogida!</p>
      ${seccionRecomendaciones}
      <p>Gracias por confiar en Pet Spa. 🐾</p>
    `,
  }, { tipo: 'cita_completada', referenciaId: idCita });
}

async function notificarCitaReprogramada({ email, nombreCliente, nombreMascota, nombreServicio, fechaHoraInicio, idCita = null }) {
  const fecha = new Date(fechaHoraInicio).toLocaleString('es-CL', { dateStyle: 'full', timeStyle: 'short' });
  await sendMail({
    to: email,
    subject: '📅 Tu cita ha sido reprogramada — Pet Spa',
    html: `
      <h2>Hola ${nombreCliente},</h2>
      <p>Tu cita ha sido <strong>reprogramada</strong> a una nueva fecha.</p>
      <ul>
        <li><strong>Mascota:</strong> ${nombreMascota}</li>
        <li><strong>Servicio:</strong> ${nombreServicio}</li>
        <li><strong>Nueva fecha y hora:</strong> ${fecha}</li>
      </ul>
      <p>Si tienes alguna duda, contáctanos.</p>
    `,
  }, { tipo: 'cita_reprogramada', referenciaId: idCita });
}

async function notificarCancelacion({ email, nombreCliente, nombreMascota, nombreServicio, motivo, idCita = null }) {
  await sendMail({
    to: email,
    subject: '❌ Has cancelado tu cita — Pet Spa',
    html: `
      <h2>Hola ${nombreCliente},</h2>
      <p>Tu cita ha sido <strong>cancelada</strong> según tu solicitud.</p>
      <ul>
        <li><strong>Mascota:</strong> ${nombreMascota}</li>
        <li><strong>Servicio:</strong> ${nombreServicio}</li>
        <li><strong>Motivo:</strong> ${motivo}</li>
      </ul>
      <p>Si deseas reagendar, ingresa a tu cuenta o contáctanos.</p>
    `,
  }, { tipo: 'cita_cancelada_cliente', referenciaId: idCita });
}

// ── Recordatorios (también registran, pero el scheduler ya los graba vía repo) ─

async function notificarRecordatorio24h({ email, nombreCliente, nombreMascota, nombreServicio, fechaHoraInicio }) {
  const fecha = new Date(fechaHoraInicio).toLocaleString('es-CL', { dateStyle: 'full', timeStyle: 'short' });
  await sendMail({
    to: email,
    subject: '⏰ Recordatorio: tu cita es mañana — Pet Spa',
    html: `
      <h2>Hola ${nombreCliente},</h2>
      <p>Te recordamos que <strong>mañana tienes una cita</strong> en Pet Spa.</p>
      <ul>
        <li><strong>Mascota:</strong> ${nombreMascota}</li>
        <li><strong>Servicio:</strong> ${nombreServicio}</li>
        <li><strong>Fecha y hora:</strong> ${fecha}</li>
      </ul>
      <p>Si necesitas cancelar o reprogramar, hazlo con anticipación a través de tu cuenta.</p>
      <p>¡Te esperamos! 🐾</p>
    `
    // sin log — el schedulerService ya llama notifRepo.marcarEnviada directamente
  });
}

async function notificarRecordatorio2h({ email, nombreCliente, nombreMascota, nombreServicio, fechaHoraInicio }) {
  const fecha = new Date(fechaHoraInicio).toLocaleString('es-CL', { dateStyle: 'full', timeStyle: 'short' });
  await sendMail({
    to: email,
    subject: '⏰ Tu cita es en 2 horas — Pet Spa',
    html: `
      <h2>Hola ${nombreCliente},</h2>
      <p>Tu cita en Pet Spa <strong>comienza en aproximadamente 2 horas</strong>.</p>
      <ul>
        <li><strong>Mascota:</strong> ${nombreMascota}</li>
        <li><strong>Servicio:</strong> ${nombreServicio}</li>
        <li><strong>Hora:</strong> ${fecha}</li>
      </ul>
      <p>Por favor llega unos minutos antes. ¡Nos vemos pronto! 🐾</p>
    `
  });
}

async function notificarBajoStock(producto, admins) {
  if (!admins || admins.length === 0) return;
  const emails = admins.map((a) => a.email).join(', ');
  await sendMail({
    to: emails,
    subject: `⚠️ Stock bajo: ${producto.nombre} — Pet Spa`,
    html: `
      <h2>Alerta de stock bajo</h2>
      <p>El producto <strong>${producto.nombre}</strong> ha alcanzado el stock mínimo.</p>
      <ul>
        <li><strong>Stock actual:</strong> ${producto.stock} unidades</li>
        <li><strong>Stock mínimo configurado:</strong> ${producto.stock_minimo} unidades</li>
        <li><strong>Categoría:</strong> ${producto.categoria}</li>
      </ul>
      <p>Por favor realiza un nuevo pedido de reabastecimiento.</p>
    `
    // sin log — pedidoService ya llama notifRepo.marcarEnviada directamente
  });
}

module.exports = {
  notificarCitaConfirmada,
  notificarCitaCancelada,
  notificarCitaCompletada,
  notificarCitaReprogramada,
  notificarCancelacion,
  notificarRecordatorio24h,
  notificarRecordatorio2h,
  notificarBajoStock,
};
