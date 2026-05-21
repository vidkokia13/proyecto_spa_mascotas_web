'use strict';

const db = require('../config/db');

async function findByCita(idCita, client = db) {
  const { rows } = await client.query(
    'SELECT * FROM fichas_tecnicas WHERE id_cita = $1',
    [idCita],
  );
  return rows[0] || null;
}

async function upsert({ idCita, estadoPelaje = null, condicionPiel = null, observaciones = null,
  pesoActual = null, creadoPor = null }, client = db) {
  const { rows } = await client.query(
    `INSERT INTO fichas_tecnicas
       (id_cita, estado_pelaje, condicion_piel, observaciones, peso_actual, creado_por)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id_cita) DO UPDATE SET
       estado_pelaje  = EXCLUDED.estado_pelaje,
       condicion_piel = EXCLUDED.condicion_piel,
       observaciones  = EXCLUDED.observaciones,
       peso_actual    = EXCLUDED.peso_actual,
       actualizado_en = NOW()
     RETURNING *`,
    [idCita, estadoPelaje, condicionPiel, observaciones, pesoActual, creadoPor],
  );
  return rows[0];
}

module.exports = { findByCita, upsert };
