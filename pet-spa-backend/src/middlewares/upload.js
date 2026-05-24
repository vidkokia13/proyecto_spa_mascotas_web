'use strict';

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function makeStorage(subdir) {
  const dir = path.join(__dirname, '..', '..', 'uploads', subdir);
  ensureDir(dir);
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, name);
    },
  });
}

// Fotos de citas — solo imágenes
function imageFilter(_req, file, cb) {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP.'), false);
}

const upload = multer({
  storage: makeStorage('citas'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Carnet de vacunas — imágenes o PDF
function carnetFilter(_req, file, cb) {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Solo se permiten imágenes o PDF para el carnet.'), false);
}

const uploadCarnet = multer({
  storage: makeStorage('carnets'),
  fileFilter: carnetFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB para PDFs
});

module.exports = { upload, uploadCarnet };
