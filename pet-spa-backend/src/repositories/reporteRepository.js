'use strict';

const db = require('../config/db');

// ── Helpers ───────────────────────────────────────────────────────────────────

function rango(fechaInicio, fechaFin) {
  return [fechaInicio, fechaFin];
}

// ── 1. Ventas + ranking de servicios (ADMIN) ──────────────────────────────────

async function ventasPorPeriodo(fechaInicio, fechaFin, client = db) {
  const params = rango(fechaInicio, fechaFin);

  const { rows: resumenCitas } = await client.query(`
    SELECT
      COUNT(DISTINCT p.id_pago)::int                               AS total_pagos,
      COUNT(DISTINCT p.id_cita)::int                               AS total_citas_pagadas,
      COALESCE(SUM(p.monto),              0)::numeric              AS total_bruto,
      COALESCE(SUM(p.descuento),          0)::numeric              AS total_descuentos,
      COALESCE(SUM(p.monto - p.descuento),0)::numeric              AS total_neto
    FROM pagos p
    WHERE DATE(p.creado_en) BETWEEN $1 AND $2
  `, params);

  const { rows: resumenTienda } = await client.query(`
    SELECT
      COUNT(*)::int                              AS total_ventas_tienda,
      COALESCE(SUM(monto), 0)::numeric          AS total_tienda
    FROM pagos_pedidos
    WHERE DATE(creado_en) BETWEEN $1 AND $2
  `, params);

  const { rows: porMetodo } = await client.query(`
    SELECT
      metodo,
      COUNT(*)::int                                   AS cantidad,
      COALESCE(SUM(monto - descuento), 0)::numeric   AS total
    FROM pagos
    WHERE DATE(creado_en) BETWEEN $1 AND $2
    GROUP BY metodo
    ORDER BY total DESC
  `, params);

  const { rows: porMetodoTienda } = await client.query(`
    SELECT
      metodo,
      COUNT(*)::int                        AS cantidad,
      COALESCE(SUM(monto), 0)::numeric    AS total
    FROM pagos_pedidos
    WHERE DATE(creado_en) BETWEEN $1 AND $2
    GROUP BY metodo
    ORDER BY total DESC
  `, params);

  const { rows: rankingServicios } = await client.query(`
    SELECT
      s.id_servicio,
      s.nombre                                                   AS servicio,
      s.categoria,
      COUNT(c.id_cita)::int                                      AS num_citas,
      COALESCE(SUM(p.monto - p.descuento), 0)::numeric           AS ingresos,
      ROUND(AVG(p.monto - p.descuento), 2)::numeric              AS promedio_ingreso
    FROM citas c
    JOIN servicios s ON c.id_servicio = s.id_servicio
    LEFT JOIN pagos p ON p.id_cita = c.id_cita
    WHERE c.estado = 'completada'
      AND DATE(c.fecha_cita) BETWEEN $1 AND $2
    GROUP BY s.id_servicio, s.nombre, s.categoria
    ORDER BY ingresos DESC
  `, params);

  const { rows: tendenciaDiaria } = await client.query(`
    SELECT
      DATE(p.creado_en)::text                        AS fecha,
      COUNT(*)::int                                  AS pagos,
      COALESCE(SUM(p.monto - p.descuento), 0)::numeric AS total
    FROM pagos p
    WHERE DATE(p.creado_en) BETWEEN $1 AND $2
    GROUP BY DATE(p.creado_en)
    ORDER BY DATE(p.creado_en)
  `, params);

  return {
    resumen: { ...resumenCitas[0], ...resumenTienda[0] },
    porMetodoCitas:   porMetodo,
    porMetodoTienda,
    rankingServicios,
    tendenciaDiaria,
  };
}

// ── 2. Ocupación global (ADMIN) ───────────────────────────────────────────────

async function ocupacionGlobal(fechaInicio, fechaFin, client = db) {
  const params = rango(fechaInicio, fechaFin);

  const { rows: resumen } = await client.query(`
    SELECT
      COUNT(*)::int                                                             AS total_citas,
      COUNT(*) FILTER (WHERE estado = 'completada')::int                       AS completadas,
      COUNT(*) FILTER (WHERE estado = 'cancelada')::int                        AS canceladas,
      COUNT(*) FILTER (WHERE estado IN ('pendiente','confirmada','en_proceso'))::int AS activas,
      ROUND(COUNT(*) FILTER (WHERE estado = 'completada')::numeric /
            NULLIF(COUNT(*),0) * 100, 1)::numeric                              AS tasa_completadas_pct,
      ROUND(COUNT(*) FILTER (WHERE estado = 'cancelada')::numeric /
            NULLIF(COUNT(*),0) * 100, 1)::numeric                              AS tasa_cancelacion_pct
    FROM citas
    WHERE fecha_cita BETWEEN $1 AND $2
  `, params);

  const { rows: porDia } = await client.query(`
    SELECT
      fecha_cita::text                                                          AS fecha,
      COUNT(*)::int                                                             AS total,
      COUNT(*) FILTER (WHERE estado = 'completada')::int                       AS completadas,
      COUNT(*) FILTER (WHERE estado = 'cancelada')::int                        AS canceladas,
      COUNT(*) FILTER (WHERE estado IN ('pendiente','confirmada','en_proceso'))::int AS activas
    FROM citas
    WHERE fecha_cita BETWEEN $1 AND $2
    GROUP BY fecha_cita
    ORDER BY fecha_cita
  `, params);

  const { rows: porGroomer } = await client.query(`
    SELECT
      COALESCE(tu.nombre, 'Sin asignar')                                        AS groomer,
      COUNT(c.id_cita)::int                                                     AS total,
      COUNT(*) FILTER (WHERE c.estado = 'completada')::int                      AS completadas,
      COUNT(*) FILTER (WHERE c.estado = 'cancelada')::int                       AS canceladas,
      ROUND(COUNT(*) FILTER (WHERE c.estado = 'completada')::numeric /
            NULLIF(COUNT(c.id_cita), 0) * 100, 1)::numeric                     AS tasa_pct
    FROM citas c
    LEFT JOIN trabajadores t   ON c.id_trabajador = t.id_trabajador
    LEFT JOIN usuarios     tu  ON t.id_usuario    = tu.id_usuario
    WHERE c.fecha_cita BETWEEN $1 AND $2
    GROUP BY tu.nombre
    ORDER BY completadas DESC
  `, params);

  return { resumen: resumen[0], porDia, porGroomer };
}

// ── 3. NPS / Satisfacción (ADMIN) ─────────────────────────────────────────────

async function reporteNps(fechaInicio, fechaFin, client = db) {
  const params = rango(fechaInicio, fechaFin);

  const { rows: resumen } = await client.query(`
    SELECT
      COUNT(*)::int                                                    AS total_calificaciones,
      ROUND(AVG(puntuacion), 2)::numeric                               AS promedio,
      COUNT(*) FILTER (WHERE puntuacion >= 4)::int                    AS promotores,
      COUNT(*) FILTER (WHERE puntuacion = 3)::int                     AS pasivos,
      COUNT(*) FILTER (WHERE puntuacion <= 2)::int                    AS detractores,
      ROUND((COUNT(*) FILTER (WHERE puntuacion >= 4)::numeric -
             COUNT(*) FILTER (WHERE puntuacion <= 2)::numeric) /
            NULLIF(COUNT(*), 0) * 100)::int                           AS nps
    FROM calificaciones
    WHERE DATE(creado_en) BETWEEN $1 AND $2
  `, params);

  const { rows: distribucion } = await client.query(`
    SELECT puntuacion, COUNT(*)::int AS cantidad
    FROM calificaciones
    WHERE DATE(creado_en) BETWEEN $1 AND $2
    GROUP BY puntuacion
    ORDER BY puntuacion
  `, params);

  const { rows: recientes } = await client.query(`
    SELECT
      cal.puntuacion, cal.comentario, cal.creado_en,
      u.nombre    AS cliente,
      m.nombre    AS mascota,
      s.nombre    AS servicio
    FROM calificaciones cal
    JOIN citas     c  ON cal.id_cita   = c.id_cita
    JOIN mascotas  m  ON c.id_mascota  = m.id_mascota
    JOIN servicios s  ON c.id_servicio = s.id_servicio
    JOIN clientes  cl ON c.id_cliente  = cl.id_cliente
    JOIN usuarios  u  ON cl.id_usuario = u.id_usuario
    WHERE DATE(cal.creado_en) BETWEEN $1 AND $2
    ORDER BY cal.creado_en DESC
    LIMIT 20
  `, params);

  return { resumen: resumen[0], distribucion, recientes };
}

// ── 4. Cronograma diario (RECEPCION) ─────────────────────────────────────────

async function cronogramaDiario(fecha, client = db) {
  const { rows } = await client.query(`
    SELECT
      c.id_cita,
      c.fecha_hora_inicio,
      c.fecha_hora_fin,
      c.estado,
      c.notas,
      m.nombre         AS mascota,
      m.tamano,
      m.temperamento,
      s.nombre         AS servicio,
      u.nombre         AS cliente,
      u.email          AS email_cliente,
      COALESCE(tu.nombre, 'Sin asignar') AS groomer
    FROM citas c
    JOIN mascotas  m  ON c.id_mascota  = m.id_mascota
    JOIN servicios s  ON c.id_servicio = s.id_servicio
    JOIN clientes  cl ON c.id_cliente  = cl.id_cliente
    JOIN usuarios  u  ON cl.id_usuario = u.id_usuario
    LEFT JOIN trabajadores t  ON c.id_trabajador = t.id_trabajador
    LEFT JOIN usuarios    tu  ON t.id_usuario    = tu.id_usuario
    WHERE c.fecha_cita = $1
      AND c.estado <> 'cancelada'
    ORDER BY c.fecha_hora_inicio NULLS LAST, tu.nombre
  `, [fecha]);
  return rows;
}

// ── 5. Cancelaciones (RECEPCION) ──────────────────────────────────────────────

async function cancelaciones(fechaInicio, fechaFin, client = db) {
  const params = rango(fechaInicio, fechaFin);

  const { rows } = await client.query(`
    SELECT
      c.id_cita,
      c.fecha_cita,
      c.fecha_hora_inicio,
      c.motivo_cancelacion,
      m.nombre  AS mascota,
      s.nombre  AS servicio,
      u.nombre  AS cliente,
      u.email   AS email_cliente
    FROM citas c
    JOIN mascotas  m  ON c.id_mascota  = m.id_mascota
    JOIN servicios s  ON c.id_servicio = s.id_servicio
    JOIN clientes  cl ON c.id_cliente  = cl.id_cliente
    JOIN usuarios  u  ON cl.id_usuario = u.id_usuario
    WHERE c.estado = 'cancelada'
      AND c.fecha_cita BETWEEN $1 AND $2
    ORDER BY c.fecha_cita DESC, c.fecha_hora_inicio DESC
  `, params);

  const { rows: resumen } = await client.query(`
    SELECT
      COUNT(*)::int                                              AS total_canceladas,
      COUNT(*) FILTER (WHERE motivo_cancelacion IS NOT NULL)::int AS con_motivo
    FROM citas
    WHERE estado = 'cancelada'
      AND fecha_cita BETWEEN $1 AND $2
  `, params);

  return { cancelaciones: rows, resumen: resumen[0] };
}

// ── 6. Productividad de groomers (ADMIN/GROOMER) ──────────────────────────────

async function productividadGroomers(fechaInicio, fechaFin, idTrabajador = null, client = db) {
  const params = [fechaInicio, fechaFin];
  const filtro = idTrabajador ? `AND t.id_trabajador = $3` : '';
  if (idTrabajador) params.push(idTrabajador);

  const { rows } = await client.query(`
    SELECT
      t.id_trabajador,
      tu.nombre                                                           AS groomer,
      COUNT(c.id_cita)::int                                               AS total_citas,
      COUNT(*) FILTER (WHERE c.estado = 'completada')::int                AS completadas,
      COUNT(*) FILTER (WHERE c.estado = 'cancelada')::int                 AS canceladas,
      COALESCE(SUM(p.monto - COALESCE(p.descuento,0)), 0)::numeric        AS ingresos_generados,
      ROUND(COUNT(*) FILTER (WHERE c.estado = 'completada')::numeric /
            NULLIF(COUNT(c.id_cita),0) * 100, 1)::numeric                 AS tasa_completadas_pct,
      ROUND(AVG(
        EXTRACT(EPOCH FROM (c.fecha_hora_fin - c.fecha_hora_inicio)) / 60.0
      ) FILTER (WHERE c.estado = 'completada'), 0)::numeric               AS duracion_promedio_min
    FROM trabajadores t
    JOIN usuarios tu ON t.id_usuario = tu.id_usuario
    LEFT JOIN citas c ON c.id_trabajador = t.id_trabajador
      AND c.fecha_cita BETWEEN $1 AND $2
    LEFT JOIN pagos p ON p.id_cita = c.id_cita
    WHERE tu.activo = true ${filtro}
    GROUP BY t.id_trabajador, tu.nombre
    ORDER BY completadas DESC
  `, params);

  return rows;
}

// ── 7. Consumo de insumos por groomer (GROOMER) ───────────────────────────────

async function insumosGroomer(idTrabajador, fechaInicio, fechaFin, client = db) {
  const { rows } = await client.query(`
    SELECT
      i.id_insumo,
      i.nombre                                           AS insumo,
      i.unidad,
      COUNT(DISTINCT ci.id_cita)::int                    AS num_citas,
      COALESCE(SUM(ci.cantidad_usada),    0)::numeric    AS total_usado,
      COALESCE(SUM(ci.cantidad_devuelta), 0)::numeric    AS total_devuelto,
      COALESCE(SUM(ci.desperdicio),       0)::numeric    AS total_desperdicio,
      ROUND(AVG(ci.cantidad_usada), 2)::numeric          AS promedio_por_cita
    FROM cita_insumos ci
    JOIN insumos i ON ci.id_insumo = i.id_insumo
    JOIN citas   c ON ci.id_cita   = c.id_cita
    WHERE c.id_trabajador = $1
      AND c.fecha_cita BETWEEN $2 AND $3
      AND c.estado = 'completada'
    GROUP BY i.id_insumo, i.nombre, i.unidad
    ORDER BY total_usado DESC
  `, [idTrabajador, fechaInicio, fechaFin]);

  const { rows: resumen } = await client.query(`
    SELECT
      COUNT(DISTINCT ci.id_insumo)::int      AS tipos_insumos,
      COUNT(DISTINCT ci.id_cita)::int        AS citas_con_insumos
    FROM cita_insumos ci
    JOIN citas c ON ci.id_cita = c.id_cita
    WHERE c.id_trabajador = $1
      AND c.fecha_cita BETWEEN $2 AND $3
      AND c.estado = 'completada'
  `, [idTrabajador, fechaInicio, fechaFin]);

  return { insumos: rows, resumen: resumen[0] };
}

// ── 8. Historial clínico del cliente (CLIENTE) ────────────────────────────────

async function historialClinico(idUsuario, idMascota = null, client = db) {
  const params = [idUsuario];
  const filtroMascota = idMascota ? `AND c.id_mascota = $2` : '';
  if (idMascota) params.push(idMascota);

  const { rows } = await client.query(`
    SELECT
      c.id_cita,
      c.fecha_cita,
      c.fecha_hora_inicio,
      c.estado,
      m.id_mascota,
      m.nombre            AS mascota,
      m.tamano,
      m.foto_url          AS foto_mascota,
      s.nombre            AS servicio,
      COALESCE(tu.nombre, 'Sin asignar') AS groomer,
      ft.estado_pelaje,
      ft.condicion_piel,
      ft.observaciones,
      ft.peso_actual,
      ft.estado_ingreso,
      ft.recomendaciones,
      cal.puntuacion,
      cal.comentario      AS comentario_calificacion,
      COALESCE(
        json_agg(
          json_build_object('url', cf.url, 'tipo', cf.tipo)
          ORDER BY cf.tipo, cf.creado_en
        ) FILTER (WHERE cf.id_foto IS NOT NULL),
        '[]'::json
      ) AS fotos
    FROM citas c
    JOIN mascotas  m  ON c.id_mascota  = m.id_mascota
    JOIN servicios s  ON c.id_servicio = s.id_servicio
    JOIN clientes  cl ON c.id_cliente  = cl.id_cliente
    LEFT JOIN trabajadores     t   ON c.id_trabajador = t.id_trabajador
    LEFT JOIN usuarios         tu  ON t.id_usuario    = tu.id_usuario
    LEFT JOIN fichas_tecnicas  ft  ON ft.id_cita      = c.id_cita
    LEFT JOIN cita_fotos       cf  ON cf.id_cita      = c.id_cita
    LEFT JOIN calificaciones   cal ON cal.id_cita     = c.id_cita
    WHERE cl.id_usuario = $1
      AND c.estado = 'completada'
      ${filtroMascota}
    GROUP BY
      c.id_cita, c.fecha_cita, c.fecha_hora_inicio, c.estado,
      m.id_mascota, m.nombre, m.tamano, m.foto_url,
      s.nombre, tu.nombre,
      ft.estado_pelaje, ft.condicion_piel, ft.observaciones,
      ft.peso_actual, ft.estado_ingreso, ft.recomendaciones,
      cal.puntuacion, cal.comentario
    ORDER BY c.fecha_cita DESC
  `, params);

  return rows;
}

// ── 9. Promociones del cliente (CLIENTE) ──────────────────────────────────────

async function misPromociones(idUsuario, client = db) {
  const { rows: usadas } = await client.query(`
    SELECT
      pr.id_promocion,
      pr.nombre     AS promocion,
      pr.tipo,
      pr.valor,
      pr.codigo,
      p.monto,
      p.descuento   AS descuento_aplicado,
      p.creado_en,
      s.nombre      AS servicio
    FROM pagos p
    JOIN citas      c   ON p.id_cita      = c.id_cita
    JOIN clientes   cl  ON c.id_cliente   = cl.id_cliente
    JOIN servicios  s   ON c.id_servicio  = s.id_servicio
    JOIN promociones pr ON p.id_promocion = pr.id_promocion
    WHERE cl.id_usuario = $1
    ORDER BY p.creado_en DESC
  `, [idUsuario]);

  const { rows: disponibles } = await client.query(`
    SELECT id_promocion, nombre, tipo, valor, codigo, descripcion, fecha_inicio, fecha_fin
    FROM promociones
    WHERE activo = true
      AND fecha_inicio <= CURRENT_DATE
      AND fecha_fin    >= CURRENT_DATE
    ORDER BY fecha_fin
  `);

  return { usadas, disponibles };
}

// ── Calificaciones ────────────────────────────────────────────────────────────

async function crearCalificacion({ idCita, idUsuario, puntuacion, comentario }, client = db) {
  const { rows } = await client.query(`
    INSERT INTO calificaciones (id_cita, id_usuario, puntuacion, comentario)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (id_cita) DO UPDATE
      SET puntuacion = EXCLUDED.puntuacion,
          comentario = EXCLUDED.comentario
    RETURNING *
  `, [idCita, idUsuario, puntuacion, comentario ?? null]);
  return rows[0];
}

async function getCalificacionByCita(idCita, client = db) {
  const { rows } = await client.query(`
    SELECT cal.*, u.nombre AS cliente
    FROM calificaciones cal
    JOIN usuarios u ON cal.id_usuario = u.id_usuario
    WHERE cal.id_cita = $1
  `, [idCita]);
  return rows[0] ?? null;
}

// Obtener id_trabajador a partir de id_usuario
async function getTrabajadorByUsuario(idUsuario, client = db) {
  const { rows } = await client.query(
    'SELECT id_trabajador FROM trabajadores WHERE id_usuario = $1',
    [idUsuario],
  );
  return rows[0]?.id_trabajador ?? null;
}

module.exports = {
  ventasPorPeriodo,
  ocupacionGlobal,
  reporteNps,
  cronogramaDiario,
  cancelaciones,
  productividadGroomers,
  insumosGroomer,
  historialClinico,
  misPromociones,
  crearCalificacion,
  getCalificacionByCita,
  getTrabajadorByUsuario,
};
