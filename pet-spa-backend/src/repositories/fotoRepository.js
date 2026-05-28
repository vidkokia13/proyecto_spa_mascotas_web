'use strict';

const db                        = require('../config/db');
const { cloudinary, extractPublicId } = require('../config/cloudinary');

async function create({ idCita, tipo, url, subidoPor = null }, client = db) {
  const { rows } = await client.query(
    `INSERT INTO cita_fotos (id_cita, tipo, url, subido_por)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [idCita, tipo, url, subidoPor],
  );
  return rows[0];
}

async function findByCita(idCita, client = db) {
  const { rows } = await client.query(
    `SELECT f.*, u.nombre AS nombre_subido_por
     FROM cita_fotos f
     LEFT JOIN usuarios u ON f.subido_por = u.id_usuario
     WHERE f.id_cita = $1
     ORDER BY f.tipo, f.creado_en`,
    [idCita],
  );
  return rows;
}

async function findById(idFoto, client = db) {
  const { rows } = await client.query('SELECT * FROM cita_fotos WHERE id_foto = $1', [idFoto]);
  return rows[0] || null;
}

async function remove(idFoto, client = db) {
  const foto = await findById(idFoto, client);
  if (!foto) return;
  await client.query('DELETE FROM cita_fotos WHERE id_foto = $1', [idFoto]);
  // Eliminar de Cloudinary (best-effort, sin bloquear la respuesta)
  const publicId = extractPublicId(foto.url);
  if (publicId) {
    cloudinary.uploader.destroy(publicId).catch(() => {});
  }
}

module.exports = { create, findByCita, findById, remove };
