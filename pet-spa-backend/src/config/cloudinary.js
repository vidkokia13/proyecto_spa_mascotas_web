'use strict';

const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

/**
 * Extrae el public_id de una URL de Cloudinary para poder eliminar el archivo.
 * Ej: https://res.cloudinary.com/xxx/image/upload/v123/pet-spa/citas/abc.jpg
 *   → pet-spa/citas/abc
 */
function extractPublicId(url) {
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    let after = parts[1].replace(/^v\d+\//, '');
    const dot = after.lastIndexOf('.');
    if (dot !== -1) after = after.slice(0, dot);
    return after;
  } catch {
    return null;
  }
}

module.exports = { cloudinary, extractPublicId };
