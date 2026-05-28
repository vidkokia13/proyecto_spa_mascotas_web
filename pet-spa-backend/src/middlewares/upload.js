'use strict';

const multer              = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary }      = require('../config/cloudinary');

// ── Helpers ──────────────────────────────────────────────────────────────────
const imageFilter = (req, file, cb) => {
  if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) return cb(null, true);
  cb(new Error('Solo se permiten imágenes JPG, PNG o WebP.'));
};

const imageOrPdfFilter = (req, file, cb) => {
  if (/^image\/(jpeg|png|webp)$/.test(file.mimetype) || file.mimetype === 'application/pdf') {
    return cb(null, true);
  }
  cb(new Error('Solo se permiten imágenes (JPG, PNG, WebP) o PDF.'));
};

// ── Fotos de citas (imágenes) ────────────────────────────────────────────────
const citasStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:        'pet-spa/citas',
    resource_type: 'image',
  },
});

const upload = multer({
  storage:    citasStorage,
  limits:     { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

// ── Carnet de vacunas (imágenes o PDF) ───────────────────────────────────────
const carnetStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder:        'pet-spa/carnets',
    resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
  }),
});

const uploadCarnet = multer({
  storage:    carnetStorage,
  limits:     { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageOrPdfFilter,
});

module.exports = { upload, uploadCarnet };
