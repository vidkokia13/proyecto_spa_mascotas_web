'use strict';

const db = require('../config/db');

async function create({ idCita, monto, metodo, referencia = null, registradoPor = null }, client = db) {
  const { rows } = await client.query(
    `INSERT INTO pagos (id_cita, monto, metodo, referencia, registrado_por)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [idCita, monto, metodo, referencia, registradoPor],
  );
  return rows[0];
}

async function findByCita(idCita, client = db) {
  const { rows } = await client.query(
    `SELECT p.*, u.nombre AS nombre_registrado_por
     FROM pagos p
     LEFT JOIN usuarios u ON p.registrado_por = u.id_usuario
     WHERE p.id_cita = $1
     ORDER BY p.creado_en`,
    [idCita],
  );
  return rows;
}

async function findById(idPago, client = db) {
  const { rows } = await client.query('SELECT * FROM pagos WHERE id_pago = $1', [idPago]);
  return rows[0] || null;
}

async function remove(idPago, client = db) {
  await client.query('DELETE FROM pagos WHERE id_pago = $1', [idPago]);
}

async function totalByCita(idCita, client = db) {
  const { rows } = await client.query(
    'SELECT COALESCE(SUM(monto),0) AS total FROM pagos WHERE id_cita = $1',
    [idCita],
  );
  return parseFloat(rows[0].total);
}

module.exports = { create, findByCita, findById, remove, totalByCita };
