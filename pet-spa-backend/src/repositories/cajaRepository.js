'use strict';

const db = require('../config/db');

async function resumenDiario(fecha, client = db) {
  // Totales agrupados por método de pago
  const { rows: totales } = await client.query(
    `SELECT
       metodo,
       COUNT(*)::int        AS num_pagos,
       COALESCE(SUM(monto), 0)::numeric     AS total_bruto,
       COALESCE(SUM(descuento), 0)::numeric AS total_descuentos,
       COALESCE(SUM(monto - descuento), 0)::numeric AS total_neto
     FROM pagos
     WHERE DATE(creado_en AT TIME ZONE 'America/Santiago') = $1
     GROUP BY metodo`,
    [fecha],
  );

  // Lista completa de pagos del día con info de cita
  const { rows: pagos } = await client.query(
    `SELECT
       p.*,
       u.nombre            AS nombre_registrado_por,
       c.id_cita,
       m.nombre            AS nombre_mascota,
       s.nombre            AS nombre_servicio,
       uc.nombre           AS nombre_cliente,
       pr.nombre           AS nombre_promocion
     FROM pagos p
     JOIN citas     c   ON p.id_cita     = c.id_cita
     JOIN mascotas  m   ON c.id_mascota  = m.id_mascota
     JOIN servicios s   ON c.id_servicio = s.id_servicio
     JOIN clientes  cl  ON c.id_cliente  = cl.id_cliente
     JOIN usuarios  uc  ON cl.id_usuario = uc.id_usuario
     LEFT JOIN usuarios    u  ON p.registrado_por = u.id_usuario
     LEFT JOIN promociones pr ON p.id_promocion   = pr.id_promocion
     WHERE DATE(p.creado_en AT TIME ZONE 'America/Santiago') = $1
     ORDER BY p.creado_en`,
    [fecha],
  );

  // Número de citas únicas con al menos un pago ese día
  const { rows: citasRow } = await client.query(
    `SELECT COUNT(DISTINCT id_cita)::int AS num_citas
     FROM pagos
     WHERE DATE(creado_en AT TIME ZONE 'America/Santiago') = $1`,
    [fecha],
  );

  return { totales, pagos, num_citas: citasRow[0]?.num_citas ?? 0 };
}

async function findCierre(fecha, client = db) {
  const { rows } = await client.query(
    'SELECT * FROM cierres_caja WHERE fecha = $1',
    [fecha],
  );
  return rows[0] || null;
}

async function createCierre({
  fecha, totalEfectivo, totalQr, totalTransferencia,
  totalGeneral, totalDescuentos, numPagos, numCitas,
  cerradoPor, notas = null,
}, client = db) {
  const { rows } = await client.query(
    `INSERT INTO cierres_caja
       (fecha, total_efectivo, total_qr, total_transferencia,
        total_general, total_descuentos, num_pagos, num_citas, cerrado_por, notas)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (fecha) DO UPDATE SET
       total_efectivo = EXCLUDED.total_efectivo,
       total_qr = EXCLUDED.total_qr,
       total_transferencia = EXCLUDED.total_transferencia,
       total_general = EXCLUDED.total_general,
       total_descuentos = EXCLUDED.total_descuentos,
       num_pagos = EXCLUDED.num_pagos,
       num_citas = EXCLUDED.num_citas,
       cerrado_por = EXCLUDED.cerrado_por,
       notas = EXCLUDED.notas,
       cerrado_en = NOW()
     RETURNING *`,
    [fecha, totalEfectivo, totalQr, totalTransferencia,
      totalGeneral, totalDescuentos, numPagos, numCitas, cerradoPor, notas],
  );
  return rows[0];
}

async function listCierres({ limit = 30, offset = 0 } = {}, client = db) {
  const { rows } = await client.query(
    `SELECT cc.*, u.nombre AS nombre_cerrado_por
     FROM cierres_caja cc
     LEFT JOIN usuarios u ON cc.cerrado_por = u.id_usuario
     ORDER BY cc.fecha DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  return rows;
}

module.exports = { resumenDiario, findCierre, createCierre, listCierres };
