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

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Activá tu cuenta — Pet Spa</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Helvetica Neue',Arial,sans-serif;">
  <span style="display:none;font-size:1px;color:#f4f4f7;max-height:0;overflow:hidden;">Activá tu cuenta en Pet Spa — enlace válido por 15 minutos.</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;" cellpadding="0" cellspacing="0">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <div style="display:inline-block;background:#7c3aed;border-radius:12px;padding:10px 20px;">
              <span style="color:#fff;font-size:18px;font-weight:700;">🐾 Pet Spa</span>
            </div>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background:#fff;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
            <div style="height:4px;background:linear-gradient(90deg,#7c3aed,#a78bfa);"></div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:40px;">
                  <h2 style="margin:0 0 8px;font-size:24px;color:#111827;">¡Bienvenido/a, ${escapeHtml(user.nombre)}! 🎉</h2>
                  <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                    Tu cuenta en Pet Spa fue creada con éxito. Solo falta un paso: activar tu cuenta haciendo clic en el botón de abajo.
                  </p>

                  <!-- CTA Button -->
                  <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                    <tr>
                      <td align="center" style="background:#7c3aed;border-radius:10px;">
                        <a href="${activationUrl}"
                           style="display:inline-block;padding:14px 32px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
                          ✅ Activar mi cuenta
                        </a>
                      </td>
                    </tr>
                  </table>

                  <div style="background:#f9f9fb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;">
                    <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">O copiá este enlace en tu navegador:</p>
                    <p style="margin:0;font-size:11px;color:#7c3aed;word-break:break-all;">${activationUrl}</p>
                  </div>

                  <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">
                    ⚠️ Este enlace es válido por <strong>15 minutos</strong>. Si no creaste esta cuenta, podés ignorar este correo.
                  </p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#f9f9fb;border-top:1px solid #ebebef;padding:16px 40px;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                    Este correo fue enviado automáticamente por Pet Spa. Por favor no respondas a este mensaje.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding-top:24px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Pet Spa — Todos los derechos reservados</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

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
