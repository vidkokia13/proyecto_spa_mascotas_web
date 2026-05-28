'use strict';

const path = require('path');
const dotenv = require('dotenv');
const Joi = require('joi');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().integer().default(3000),

  // PostgreSQL
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().integer().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_POOL_MAX: Joi.number().integer().default(10),
  DB_POOL_IDLE_TIMEOUT_MS: Joi.number().integer().default(30000),

  // JWT
  JWT_SECRET: Joi.string().min(32).required()
    .messages({ 'string.min': 'JWT_SECRET debe tener al menos 32 caracteres.' }),
  JWT_EXPIRES_IN: Joi.string().default('8h'),

  // Bcrypt
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(10).max(15).default(12),

  // CORS
  CORS_ORIGIN: Joi.string().default('*'),

  // Mailtrap / SMTP
  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().integer().required(),
  MAIL_USER: Joi.string().required(),
  MAIL_PASSWORD: Joi.string().required(),
  MAIL_FROM: Joi.string().required(),

  APP_FRONTEND_URL: Joi.string().uri().default('http://localhost:5173'),

  // Rate limit
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: Joi.number().integer().default(100),
}).unknown(true);

const { value: env, error } = schema.validate(process.env, { abortEarly: false });

if (error) {
  console.error('❌ Error en variables de entorno:\n', error.message);
  process.exit(1);
}

module.exports = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,

  db: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    poolMax: env.DB_POOL_MAX,
    idleTimeoutMs: env.DB_POOL_IDLE_TIMEOUT_MS,
  },

  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },

  bcrypt: {
    saltRounds: env.BCRYPT_SALT_ROUNDS,
  },

  cors: {
    origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
  },

  mail: {
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    user: env.MAIL_USER,
    password: env.MAIL_PASSWORD,
    from: env.MAIL_FROM,
  },

  app: {
    frontendUrl: env.APP_FRONTEND_URL,
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  },
};
