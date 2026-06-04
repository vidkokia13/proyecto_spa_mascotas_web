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

// ── Base email template ───────────────────────────────────────────────────────

function emailLayout({ title, preheader = '', body, footerNote = '' }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Helvetica Neue',Arial,sans-serif;">
  <!-- preheader (hidden) -->
  <span style="display:none;font-size:1px;color:#f4f4f7;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:580px;" cellpadding="0" cellspacing="0">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#7c3aed;border-radius:12px;padding:10px 20px;">
                    <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:0.5px;">🐾 Pet Spa</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">

              <!-- Card top accent -->
              <div style="height:4px;background:linear-gradient(90deg,#7c3aed,#a78bfa);"></div>

              <!-- Card body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:36px 40px;">
                    ${body}
                  </td>
                </tr>
              </table>

              <!-- Card footer -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#f9f9fb;border-top:1px solid #ebebef;padding:20px 40px;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                      ${footerNote || 'Este correo fue enviado automáticamente por Pet Spa. Por favor no respondas a este mensaje.'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Pet Spa — Todos los derechos reservados</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function infoRow(label, value) {
  return `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:#6b7280;width:40%;">${label}</td>
            <td style="font-size:14px;color:#111827;font-weight:600;">${value}</td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function infoTable(rows) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
      <tbody>
        ${rows}
      </tbody>
    </table>`;
}

function alertBadge(type, text) {
  const colors = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', dot: '#22c55e' },
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', dot: '#f59e0b' },
    error:   { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', dot: '#ef4444' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', dot: '#3b82f6' },
  };
  const c = colors[type] || colors.info;
  return `
    <div style="background:${c.bg};border:1px solid ${c.border};border-radius:8px;padding:12px 16px;margin:16px 0;display:flex;align-items:center;gap:8px;">
      <span style="color:${c.dot};font-size:18px;">●</span>
      <span style="color:${c.text};font-size:14px;">${text}</span>
    </div>`;
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
    html: emailLayout({
      title: 'Cita confirmada',
      preheader: `Tu cita para ${nombreMascota} el ${fecha} ha sido confirmada.`,
      body: `
        <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">¡Cita confirmada! 🎉</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hola <strong>${nombreCliente}</strong>, tu reserva ha sido aprobada y está lista.</p>
        ${alertBadge('success', 'Tu cita está confirmada y en agenda.')}
        ${infoTable(
          infoRow('Mascota', nombreMascota) +
          infoRow('Servicio', nombreServicio) +
          infoRow('Fecha y hora', fecha)
        )}
        <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">
          Recuerda llegar unos minutos antes. Si necesitas cancelar o reprogramar, hazlo con al menos <strong>24 horas de anticipación</strong> desde tu cuenta.
        </p>
        <p style="margin:16px 0 0;font-size:15px;color:#111827;">¡Te esperamos en Pet Spa! 🐾</p>
      `,
    }),
  }, { tipo: 'cita_confirmada', referenciaId: idCita });
}

async function notificarCitaCancelada({ email, nombreCliente, nombreMascota, nombreServicio, fechaHoraInicio, idCita = null }) {
  const fecha = new Date(fechaHoraInicio).toLocaleString('es-CL', { dateStyle: 'full', timeStyle: 'short' });
  await sendMail({
    to: email,
    subject: '❌ Tu cita ha sido cancelada — Pet Spa',
    html: emailLayout({
      title: 'Cita cancelada',
      preheader: `Tu cita para ${nombreMascota} el ${fecha} ha sido cancelada.`,
      body: `
        <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Cita cancelada</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hola <strong>${nombreCliente}</strong>, lamentamos informarte que tu cita fue cancelada.</p>
        ${alertBadge('error', 'Tu cita no podrá realizarse en la fecha indicada.')}
        ${infoTable(
          infoRow('Mascota', nombreMascota) +
          infoRow('Servicio', nombreServicio) +
          infoRow('Fecha y hora', fecha)
        )}
        <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">
          Si deseas reagendar, ingresa a tu cuenta y solicita una nueva cita. Estamos para ayudarte.
        </p>
      `,
    }),
  }, { tipo: 'cita_cancelada', referenciaId: idCita });
}

async function notificarCitaCompletada({ email, nombreCliente, nombreMascota, nombreServicio, recomendaciones = null, idCita = null }) {
  const recoSection = recomendaciones
    ? `<div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.5px;">Recomendaciones del groomer</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${recomendaciones}</p>
       </div>`
    : '';
  await sendMail({
    to: email,
    subject: '🐾 ¡Tu mascota está lista! — Pet Spa',
    html: emailLayout({
      title: 'Servicio completado',
      preheader: `¡${nombreMascota} está listo/a para ser recogido/a!`,
      body: `
        <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">¡Servicio completado! 🐾</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hola <strong>${nombreCliente}</strong>, ¡buenas noticias!</p>
        ${alertBadge('success', `${nombreMascota} está listo/a para ser recogido/a. ¡Ya puede venir a buscarlo/a!`)}
        ${infoTable(
          infoRow('Mascota', nombreMascota) +
          infoRow('Servicio realizado', nombreServicio)
        )}
        ${recoSection}
        <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">
          Gracias por confiar en Pet Spa. No olvides <strong>calificar el servicio</strong> desde tu cuenta, ¡tu opinión nos ayuda a mejorar!
        </p>
      `,
    }),
  }, { tipo: 'cita_completada', referenciaId: idCita });
}

async function notificarCitaReprogramada({ email, nombreCliente, nombreMascota, nombreServicio, fechaHoraInicio, idCita = null }) {
  const fecha = new Date(fechaHoraInicio).toLocaleString('es-CL', { dateStyle: 'full', timeStyle: 'short' });
  await sendMail({
    to: email,
    subject: '📅 Tu cita fue reprogramada — Pet Spa',
    html: emailLayout({
      title: 'Cita reprogramada',
      preheader: `Tu cita de ${nombreServicio} para ${nombreMascota} fue cambiada al ${fecha}.`,
      body: `
        <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Cita reprogramada 📅</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hola <strong>${nombreCliente}</strong>, tu cita fue movida a una nueva fecha.</p>
        ${alertBadge('warning', 'Toma nota de la nueva fecha y hora de tu cita.')}
        ${infoTable(
          infoRow('Mascota', nombreMascota) +
          infoRow('Servicio', nombreServicio) +
          infoRow('Nueva fecha y hora', fecha)
        )}
        <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">
          Si esta nueva fecha no te acomoda, ingresa a tu cuenta para solicitar otro horario o contáctanos directamente.
        </p>
      `,
    }),
  }, { tipo: 'cita_reprogramada', referenciaId: idCita });
}

async function notificarCancelacion({ email, nombreCliente, nombreMascota, nombreServicio, motivo, idCita = null }) {
  await sendMail({
    to: email,
    subject: 'Cancelación de cita confirmada — Pet Spa',
    html: emailLayout({
      title: 'Cancelación confirmada',
      preheader: `Tu cita de ${nombreServicio} para ${nombreMascota} ha sido cancelada.`,
      body: `
        <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Cancelación confirmada</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hola <strong>${nombreCliente}</strong>, tu cita fue cancelada según tu solicitud.</p>
        ${infoTable(
          infoRow('Mascota', nombreMascota) +
          infoRow('Servicio', nombreServicio) +
          infoRow('Motivo', motivo)
        )}
        <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">
          Cuando lo necesites, puedes agendar una nueva cita directamente desde tu cuenta. ¡Estaremos esperándote! 🐾
        </p>
      `,
    }),
  }, { tipo: 'cita_cancelada_cliente', referenciaId: idCita });
}

// ── Recordatorios (también registran, pero el scheduler ya los graba vía repo) ─

async function notificarRecordatorio24h({ email, nombreCliente, nombreMascota, nombreServicio, fechaHoraInicio }) {
  const fecha = new Date(fechaHoraInicio).toLocaleString('es-CL', { dateStyle: 'full', timeStyle: 'short' });
  await sendMail({
    to: email,
    subject: '⏰ Recordatorio: tu cita es mañana — Pet Spa',
    html: emailLayout({
      title: 'Recordatorio de cita — mañana',
      preheader: `Recordatorio: ${nombreMascota} tiene cita mañana a las ${fecha}.`,
      body: `
        <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Recordatorio de cita ⏰</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hola <strong>${nombreCliente}</strong>, te avisamos que mañana tienes cita con nosotros.</p>
        ${alertBadge('info', '¡Mañana es el día! Recuerda llegar unos minutos antes.')}
        ${infoTable(
          infoRow('Mascota', nombreMascota) +
          infoRow('Servicio', nombreServicio) +
          infoRow('Fecha y hora', fecha)
        )}
        <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">
          Si necesitas cancelar o reprogramar, hazlo con anticipación desde tu cuenta para liberar el slot a otro cliente.
        </p>
        <p style="margin:12px 0 0;font-size:15px;color:#111827;">¡Te esperamos! 🐾</p>
      `,
    })
    // sin log — el schedulerService ya llama notifRepo.marcarEnviada directamente
  });
}

async function notificarRecordatorio2h({ email, nombreCliente, nombreMascota, nombreServicio, fechaHoraInicio }) {
  const fecha = new Date(fechaHoraInicio).toLocaleString('es-CL', { dateStyle: 'full', timeStyle: 'short' });
  await sendMail({
    to: email,
    subject: '⏰ Tu cita es en 2 horas — Pet Spa',
    html: emailLayout({
      title: 'Tu cita es muy pronto',
      preheader: `Faltan ~2 horas para la cita de ${nombreMascota}.`,
      body: `
        <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">¡Tu cita es muy pronto! ⏰</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hola <strong>${nombreCliente}</strong>, tu cita en Pet Spa comienza en aproximadamente <strong>2 horas</strong>.</p>
        ${alertBadge('warning', 'Por favor llega unos minutos antes para evitar esperas.')}
        ${infoTable(
          infoRow('Mascota', nombreMascota) +
          infoRow('Servicio', nombreServicio) +
          infoRow('Hora', fecha)
        )}
        <p style="margin:24px 0 0;font-size:15px;color:#111827;">¡Nos vemos pronto! 🐾</p>
      `,
    })
  });
}

async function notificarBajoStock(producto, admins) {
  if (!admins || admins.length === 0) return;
  const emails = admins.map((a) => a.email).join(', ');
  const stockMinDisplay = producto.stock_minimo ?? producto.stock_minimo_efectivo ?? '—';

  // Llamada directa al transporter (NO usa sendMail) para que los errores
  // SMTP propaguen al llamador y no se marquen como "enviados" si fallaron.
  const info = await getTransporter().sendMail({
    from:    env.mail.from,
    to:      emails,
    subject: `⚠️ Alerta stock bajo: ${producto.nombre} — Pet Spa`,
    html: emailLayout({
      title: 'Alerta de stock bajo',
      preheader: `${producto.nombre} tiene solo ${producto.stock} unidades disponibles.`,
      body: `
        <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Alerta de stock bajo ⚠️</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Un producto ha alcanzado su nivel mínimo de inventario y requiere reabastecimiento.</p>
        ${alertBadge('warning', `<strong>${producto.nombre}</strong> tiene solo <strong>${producto.stock} unidades</strong> disponibles (mínimo configurado: ${stockMinDisplay}).`)}
        ${infoTable(
          infoRow('Producto', producto.nombre) +
          infoRow('Stock actual', `<span style="color:#dc2626;font-weight:700;">${producto.stock} unidades</span>`) +
          infoRow('Stock mínimo', `${stockMinDisplay} unidades`) +
          infoRow('Categoría', producto.categoria ?? '—')
        )}
        <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">
          Por favor realiza un pedido de reabastecimiento a la brevedad para evitar quiebres de stock.
        </p>
      `,
      footerNote: 'Alerta automática del sistema de inventario de Pet Spa. No respondas a este correo.',
    }),
  });
  logger.info(`Alerta bajo stock enviada a ${emails}: ${info.messageId}`);
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
