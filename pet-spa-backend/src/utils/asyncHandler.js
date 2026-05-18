/**
 * utils/asyncHandler.js
 * ---------------------
 * Envuelve handlers async para que las excepciones lleguen al
 * middleware de errores sin tener que escribir try/catch en cada controller.
 *
 * @example
 *   router.get('/x', asyncHandler(async (req, res) => { ... }));
 */
'use strict';

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
