'use strict';

const db = require('../config/db');

async function resumenDiario(fecha, client = db) {
  // Totales citas
  const { rows: totalesCitas } = await client.query(
    `SELECT metodo,
            COUNT(*)::int                         AS cantidad,
            COALESCE(SUM(monto), 0)::numeric      AS total_bruto,
            COALESCE(SUM(descuento), 0)::numeric  AS total_descuentos,
            COALESCE(SUM(monto - descuento), 0)::numeric AS total
     FROM pagos
     WHERE DATE(creado_en AT TIME ZONE 'America/Santiago') = $1
     GROUP BY metodo`,
    [fecha],
  );

  // Totales pedidos (sin descuento) — tabla puede no existir en instalaciones antiguas
  let totalesPedidos = [];
  try {
    const { rows } = await client.query(
      `SELECT metodo,
              COUNT(*)::int                    AS cantidad,
              COALESCE(SUM(monto), 0)::numeric AS total_bruto,
              0::numeric                       AS total_descuentos,
              COALESCE(SUM(monto), 0)::numeric AS total
       FROM pagos_pedidos
       WHERE DATE(creado_en AT TIME ZONE 'America/Santiago') = $1
       GROUP BY metodo`,
      [fecha],
    );
    totalesPedidos = rows;
  } catch (_e) { /* tabla pagos_pedidos aún no existe */ }

  // Combinar totales por metodo en JS
  const map = {};
  for (const r of [...totalesCitas, ...totalesPedidos]) {
    if (!map[r.metodo]) {
      map[r.metodo] = { metodo: r.metodo, cantidad: 0, total_bruto: 0, total_descuentos: 0, total: 0 };
    }
    map[r.metodo].cantidad         += Number(r.cantidad);
    map[r.metodo].total_bruto      += Number(r.total_bruto);
    map[r.metodo].total_descuentos += Number(r.total_descuentos);
    map[r.metodo].total            += Number(r.total);
  }
  const totales = Object.values(map);

  // Pagos de citas del día
  const { rows: pagosCitas } = await client.query(
    `SELECT
       p.*,
       'cita'              AS tipo,
       u.nombre            AS nombre_registrado_por,
       m.nombre            AS nombre_mascota,
       s.nombre            AS nombre_servicio,
       uc.nombre           AS nombre_cliente,
       pr.nombre           AS nombre_promocion,
       NULL::text          AS id_pedido
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

  // Pagos de pedidos del día — tabla puede no existir en instalaciones antiguas
  let pagosPedidos = [];
  try {
    const { rows } = await client.query(
      `SELECT
         pp.id_pago,
         pp.id_pedido,
         pp.monto,
         0::numeric          AS descuento,
         pp.metodo,
         pp.referencia,
         pp.registrado_por,
         pp.creado_en,
         'pedido'            AS tipo,
         ur.nombre           AS nombre_registrado_por,
         NULL::text          AS id_cita,
         NULL::text          AS id_promocion,
         'Producto'          AS nombre_mascota,
         'Venta tienda'      AS nombre_servicio,
         uc2.nombre          AS nombre_cliente,
         NULL::text          AS nombre_promocion
       FROM pagos_pedidos pp
       JOIN pedidos  ped ON ped.id_pedido  = pp.id_pedido
       JOIN usuarios uc2 ON uc2.id_usuario = ped.id_usuario
       LEFT JOIN usuarios ur ON ur.id_usuario = pp.registrado_por
       WHERE DATE(pp.creado_en AT TIME ZONE 'America/Santiago') = $1
       ORDER BY pp.creado_en`,
      [fecha],
    );
    pagosPedidos = rows;
  } catch (_e) { /* tabla pagos_pedidos aún no existe */ }

  // Combinar y ordenar por fecha
  const pagos = [...pagosCitas, ...pagosPedidos]
    .sort((a, b) => new Date(a.creado_en) - new Date(b.creado_en));

  // Número de citas únicas con pago ese día
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

async function deleteCierre(fecha, client = db) {
  const { rows } = await client.query(
    'DELETE FROM cierres_caja WHERE fecha = $1 RETURNING *',
    [fecha],
  );
  return rows[0] || null;
}

module.exports = { resumenDiario, findCierre, createCierre, listCierres, deleteCierre };
