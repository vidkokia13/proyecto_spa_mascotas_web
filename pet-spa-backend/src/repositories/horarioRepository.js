'use strict';

const db = require('../config/db');

async function findAll(client = db) {
  const { rows } = await client.query(
    'SELECT * FROM horarios_spa ORDER BY dia_semana',
  );
  return rows;
}

async function findByDia(diaSemana, client = db) {
  const { rows } = await client.query(
    'SELECT * FROM horarios_spa WHERE dia_semana = $1',
    [diaSemana],
  );
  return rows[0] || null;
}

async function upsert({ diaSemana, horaInicio, horaFin, capacidadMax = 5 }, client = db) {
  const { rows } = await client.query(
    `INSERT INTO horarios_spa (dia_semana, hora_inicio, hora_fin, capacidad_max)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (dia_semana) DO UPDATE
       SET hora_inicio = EXCLUDED.hora_inicio,
           hora_fin    = EXCLUDED.hora_fin,
           capacidad_max = EXCLUDED.capacidad_max,
           activo      = true
     RETURNING *`,
    [diaSemana, horaInicio, horaFin, capacidadMax],
  );
  return rows[0];
}

async function setActivo(diaSemana, activo, client = db) {
  const { rows } = await client.query(
    'UPDATE horarios_spa SET activo = $1 WHERE dia_semana = $2 RETURNING *',
    [activo, diaSemana],
  );
  return rows[0] || null;
}

module.exports = { findAll, findByDia, upsert, setActivo };
