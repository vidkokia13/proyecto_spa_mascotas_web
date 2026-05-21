/**
 * app.js
 * ------
 * Configura la aplicación Express:
 *   - Middlewares de seguridad (helmet, CORS, rate limit global)
 *   - Parser JSON
 *   - Logging básico de requests
 *   - Montaje de rutas en /api
 *   - Manejo de 404 y errores
 *
 * No levanta el servidor — eso lo hace server.js. Esta separación
 * facilita testing (se puede importar `app` sin abrir un puerto).
 */
'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const logger = require('./config/logger');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const app = express();

// Necesario para que req.ip refleje la IP real cuando hay reverse proxy
app.set('trust proxy', 1);

// --- Seguridad y parseo ---
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    // Permitir requests sin Origin (mobile apps, curl, healthchecks)
    if (!origin) return cb(null, true);
    if (env.cors.origin.includes('*') || env.cors.origin.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// --- Rate limit global suave (defensa en profundidad) ---
app.use(rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
}));

// --- Logging mínimo de requests ---
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// --- Archivos estáticos (fotos de citas) ---
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// --- Rutas ---
app.use('/api', routes);

// --- 404 + manejo de errores (siempre al final) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
