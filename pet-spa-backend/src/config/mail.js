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
  secure: false,
  auth: {
    user: env.mail.user,
    pass: env.mail.password,
  },
});

transporter.verify()
  .then(() => logger.info('📧 Servidor SMTP listo (Mailtrap)'))
  .catch((err) => logger.warn('⚠️  No se pudo verificar SMTP', { error: err.message }));

module.exports = {
  transporter,
  defaultFrom: env.mail.from,
};
