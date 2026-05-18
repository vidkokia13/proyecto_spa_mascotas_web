/**
 * config/mail.js
 * --------------
 * Transporter de nodemailer configurado para Mailtrap (sandbox SMTP).
 * En producción reemplazá los credenciales por los de tu proveedor real
 * (SES, SendGrid, Mailgun, etc.) — la interfaz es la misma.
 */
'use strict';

const nodemailer = require('nodemailer');
const env = require('./env');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: env.mail.host,
  port: env.mail.port,
  // Mailtrap sandbox no necesita TLS estricto; si tu proveedor en prod usa
  // 465, poné secure: true.
  secure: false,
  auth: {
    user: env.mail.user,
    pass: env.mail.password,
  },
});

// Verificación opcional al arranque (no bloquea el servidor)
transporter.verify()
  .then(() => logger.info('📧 Servidor SMTP listo (Mailtrap)'))
  .catch((err) => logger.warn('⚠️  No se pudo verificar SMTP', { error: err.message }));

module.exports = {
  transporter,
  defaultFrom: env.mail.from,
};
