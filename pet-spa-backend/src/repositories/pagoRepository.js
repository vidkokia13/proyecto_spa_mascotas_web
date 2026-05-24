'use strict';

const db = require('../config/db');

async function create({ idCita, monto, metodo, referencia = null, registradoPor = null,
  idPromocion = null, descuento = 0 }, client = db) {
  const { rows } = await client.query(
    `INSERT INTO pagos (id_cita, monto, metodo, referencia, registrado_por, id_promocion, descuento)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [idCita, monto, metodo, referencia, registradoPor, idPromocion, descuento],
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

async function reciboByCita(idCita, client = db) {
  const { rows } = await client.query(
    `SELECT
       c.id_cita, c.fecha_hora_inicio, c.duracion_ajustada, c.estado, c.notas AS notas_cita,
       m.nombre AS nombre_mascota, m.especie, m.raza, m.tamano,
       s.nombre AS nombre_servicio, s.precio_base,
       uc.nombre AS nombre_cliente, uc.email AS email_cliente,
       t_u.nombre AS nombre_trabajador,
       COALESCE(SUM(p.monto),         0)::numeric AS total_pagado,
       COALESCE(SUM(p.descuento),     0)::numeric AS total_descuentos,
       COALESCE(s.precio_base, 0)::numeric          AS precio_servicio
     FROM citas c
     JOIN mascotas  m   ON c.id_mascota  = m.id_mascota
     JOIN servicios s   ON c.id_servicio = s.id_servicio
     JOIN clientes  cl  ON c.id_cliente  = cl.id_cliente
     JOIN usuarios  uc  ON cl.id_usuario = uc.id_usuario
     LEFT JOIN trabajadores t   ON c.id_trabajador = t.id_trabajador
     LEFT JOIN usuarios   t_u   ON t.id_usuario    = t_u.id_usuario
     LEFT JOIN pagos p          ON p.id_cita        = c.id_cita
     WHERE c.id_cita = $1
     GROUP BY c.id_cita, c.fecha_hora_inicio, c.duracion_ajustada, c.estado, c.notas,
              m.nombre, m.especie, m.raza, m.tamano,
              s.nombre, s.precio_base,
              uc.nombre, uc.email,
              t_u.nombre`,
    [idCita],
  );
  return rows[0] || null;
}

module.exports = { create, findByCita, findById, remove, totalByCita, reciboByCita };
