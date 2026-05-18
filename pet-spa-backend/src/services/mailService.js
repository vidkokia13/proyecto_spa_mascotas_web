'use strict';

const jwt = require('jsonwebtoken');
const { transporter, defaultFrom } = require('../config/mail');
const env = require('../config/env');
const logger = require('../config/logger');

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Genera un JWT firmado con propósito 'account_activation' y expiración 15 min.
 */
function generateActivationToken(idUsuario) {
  return jwt.sign(
    { sub: idUsuario, purpose: 'account_activation' },
    env.jwt.secret,
    { expiresIn: '15m' },
  );
}

async function sendActivationEmail(user, token) {
  const activationUrl =
    `${env.app.frontendUrl}/activate?token=${encodeURIComponent(token)}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
      <h2 style="color:#7c3aed">¡Bienvenido a Pet Spa, ${escapeHtml(user.nombre)}!</h2>
      <p>Para activar tu cuenta hacé clic en el siguiente botón (válido por <strong>15 minutos</strong>):</p>
      <p style="text-align:center;margin:24px 0">
        <a href="${activationUrl}"
           style="background:#7c3aed;color:#fff;padding:12px 24px;
                  text-decoration:none;border-radius:8px;font-weight:bold">
          Activar mi cuenta
        </a>
      </p>
      <p style="color:#555;font-size:13px">O copiá este enlace en tu navegador:</p>
      <p style="word-break:break-all;color:#7c3aed;font-size:12px">${activationUrl}</p>
      <hr style="margin:24px 0"/>
      <small style="color:#888">Si no creaste esta cuenta, ignorá este correo. El enlace expira en 15 minutos.</small>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: defaultFrom,
      to: user.email,
      subject: 'Activá tu cuenta de Pet Spa (15 min)',
      html,
    });
    logger.info('Correo de activación enviado', { email: user.email });
  } catch (err) {
    logger.error('Falló envío de correo de activación', {
      email: user.email,
      error: err.message,
    });
  }
}

module.exports = { generateActivationToken, sendActivationEmail };
