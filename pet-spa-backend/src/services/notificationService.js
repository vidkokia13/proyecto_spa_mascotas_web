'use strict';

const nodemailer = require('nodemailer');
const env        = require('../config/env');
const logger     = require('../config/logger');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.port === 465,
      auth: { user: env.mail.user, pass: env.mail.password },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, html }) {
  try {
    const info = await getTransporter().sendMail({
      from: env.mail.from,
      to,
      subject,
      html,
    });
    logger.info(`Email enviado a ${to}: ${info.messageId}`);
  } catch (err) {
    // Falla silenciosamente — no debe romper el flujo principal
    logger.error('Error enviando email', { to, subject, error: err.message });
  }
}

// ── Templates ─────────────────────────────────────────────────────────────────

async function notificarCitaConfirmada({ email, nombreCliente, nombreMascota, nombreServicio, fechaHoraInicio }) {
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
  });
}

async function notificarCitaCancelada({ email, nombreCliente, nombreMascota, nombreServicio, fechaHoraInicio }) {
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
  });
}

async function notificarCitaCompletada({ email, nombreCliente, nombreMascota, nombreServicio, recomendaciones = null }) {
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
  });
}

async function notificarCitaReprogramada({ email, nombreCliente, nombreMascota, nombreServicio, fechaHoraInicio }) {
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
  });
}

async function notificarCancelacion({ email, nombreCliente, nombreMascota, nombreServicio, motivo }) {
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
  });
}

module.exports = {
  notificarCitaConfirmada,
  notificarCitaCancelada,
  notificarCitaCompletada,
  notificarCitaReprogramada,
  notificarCancelacion,
};
