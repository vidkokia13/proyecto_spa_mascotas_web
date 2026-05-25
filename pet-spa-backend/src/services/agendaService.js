'use strict';

const horarioRepo        = require('../repositories/horarioRepository');
const bloqueoRepo        = require('../repositories/bloqueoRepository');
const disponibilidadRepo = require('../repositories/disponibilidadRepository');
const citaRepo           = require('../repositories/citaRepository');

const SLOT_INTERVAL_MIN = 15;

function calcularDuracion(duracionBase, tamano, temperamento, tiempoExtraMin = 0) {
  const factores = { pequeno: 1.0, mediano: 1.1, grande: 1.15, gigante: 1.3 };
  const extras   = { tranquilo: 0, nervioso: 15, agresivo: 30 };
  const factor = factores[tamano]     ?? 1.0;
  const extra  = extras[temperamento] ?? 0;
  return Math.ceil(duracionBase * factor) + extra + (tiempoExtraMin || 0);
}

function minutesToTime(totalMin) {
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

async function getSlotsDisponibles({ fecha, servicio, mascota, idTrabajador = null }) {
  // Joi convierte el query param a Date object; normalizar a string YYYY-MM-DD
  const fechaStr  = fecha instanceof Date ? fecha.toISOString().slice(0, 10) : String(fecha);
  fecha = fechaStr;
  const fechaDate = new Date(fechaStr + 'T00:00:00');
  const diaSemana = fechaDate.getDay(); // 0=Sun

  const horario = await horarioRepo.findByDia(diaSemana);
  if (!horario || !horario.activo) {
    return { fecha, slots: [], mensaje: 'El spa no atiende ese día.' };
  }

  const duracion    = calcularDuracion(servicio.duracion_base, mascota.tamano, mascota.temperamento, mascota.tiempo_extra_min);
  const inicioMin   = timeToMinutes(horario.hora_inicio);
  const finSpaMin   = timeToMinutes(horario.hora_fin);

  // Spa-wide blockouts
  const inicioDia  = new Date(`${fecha}T00:00:00`);
  const finDia     = new Date(`${fecha}T23:59:59`);
  const bloqueosSpa = await bloqueoRepo.findInRange(inicioDia, finDia, null);

  // Groomer day availability (if specified)
  let groomerDisp = [];
  if (idTrabajador) {
    groomerDisp = await disponibilidadRepo.findByTrabajador(idTrabajador);
  }

  const slots = [];

  for (let slotMin = inicioMin; slotMin + duracion <= finSpaMin; slotMin += SLOT_INTERVAL_MIN) {
    const slotFinMin = slotMin + duracion;
    const slotHora   = minutesToTime(slotMin);
    const slotFinH   = minutesToTime(slotFinMin);
    const slotInicio = new Date(`${fecha}T${slotHora}:00`);
    const slotFin    = new Date(`${fecha}T${slotFinH}:00`);

    // Spa-wide blockout check
    const bloqueadoSpa = bloqueosSpa.some(b =>
      new Date(b.fecha_inicio) < slotFin && new Date(b.fecha_fin) > slotInicio,
    );
    if (bloqueadoSpa) continue;

    // Global capacity check
    const ocupadasSpa = await citaRepo.countSpaOverlaps(slotInicio, slotFin);
    if (ocupadasSpa >= horario.capacidad_max) continue;

    if (idTrabajador) {
      // Groomer must cover the full slot on this weekday
      const cubre = groomerDisp.some(d =>
        d.dia_semana === diaSemana &&
        timeToMinutes(d.hora_inicio) <= slotMin &&
        timeToMinutes(d.hora_fin)    >= slotFinMin,
      );
      if (!cubre) continue;

      // Groomer-specific blockout
      const bloqueosGroomer = await bloqueoRepo.findInRange(slotInicio, slotFin, idTrabajador);
      if (bloqueosGroomer.length > 0) continue;

      // Groomer overlap
      const overlap = await citaRepo.countOverlaps(idTrabajador, slotInicio, slotFin);
      if (overlap > 0) continue;
    }

    slots.push({ hora: slotHora, hora_fin: slotFinH, duracion_minutos: duracion });
  }

  return { fecha, dia_semana: diaSemana, duracion_ajustada: duracion, slots };
}

module.exports = { calcularDuracion, getSlotsDisponibles };
