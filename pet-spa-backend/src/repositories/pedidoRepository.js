'use strict';

const db = require('../config/db');

// ── Pedidos ───────────────────────────────────────────────────────────────────

async function findById(idPedido, client = db) {
  const { rows } = await client.query(
    `SELECT p.*, u.nombre AS cliente_nombre, u.email AS cliente_email
     FROM pedidos p
     JOIN usuarios u ON u.id_usuario = p.id_usuario
     WHERE p.id_pedido = $1`,
    [idPedido],
  );
  return rows[0] || null;
}

async function findByUsuario(idUsuario, client = db) {
  const { rows } = await client.query(
    `SELECT * FROM pedidos WHERE id_usuario = $1 ORDER BY creado_en DESC`,
    [idUsuario],
  );
  return rows;
}

async function findAll({ estado } = {}, client = db) {
  const conditions = [];
  const values = [];
  let i = 1;
  if (estado) { conditions.push(`p.estado = $${i++}`); values.push(estado); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await client.query(
    `SELECT p.*, u.nombre AS cliente_nombre
     FROM pedidos p
     JOIN usuarios u ON u.id_usuario = p.id_usuario
     ${where}
     ORDER BY p.creado_en DESC`,
    values,
  );
  return rows;
}

async function create({ idUsuario, notas }, client = db) {
  const { rows } = await client.query(
    `INSERT INTO pedidos (id_usuario, notas) VALUES ($1, $2) RETURNING *`,
    [idUsuario, notas ?? null],
  );
  return rows[0];
}

async function updateEstado(idPedido, estado, client = db) {
  const { rows } = await client.query(
    `UPDATE pedidos SET estado = $2, actualizado_en = NOW()
     WHERE id_pedido = $1 RETURNING *`,
    [idPedido, estado],
  );
  return rows[0] || null;
}

async function updateTotal(idPedido, total, client = db) {
  const { rows } = await client.query(
    `UPDATE pedidos SET total = $2, actualizado_en = NOW()
     WHERE id_pedido = $1 RETURNING *`,
    [idPedido, total],
  );
  return rows[0] || null;
}

// ── Pedido items ──────────────────────────────────────────────────────────────

async function getItems(idPedido, client = db) {
  const { rows } = await client.query(
    `SELECT pi.*, p.nombre, p.imagen_url
     FROM pedido_items pi
     JOIN productos p ON p.id_producto = pi.id_producto
     WHERE pi.id_pedido = $1`,
    [idPedido],
  );
  return rows;
}

async function addItem({ idPedido, idProducto, cantidad, precioUnitario }, client = db) {
  const subtotal = cantidad * precioUnitario;
  const { rows } = await client.query(
    `INSERT INTO pedido_items (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [idPedido, idProducto, cantidad, precioUnitario, subtotal],
  );
  return rows[0];
}

async function removeItem(idItem, client = db) {
  await client.query('DELETE FROM pedido_items WHERE id_item = $1', [idItem]);
}

// ── Pagos de pedidos (integración con caja) ───────────────────────────────────

async function createPago({ idPedido, monto, metodo, referencia, registradoPor }, client = db) {
  const { rows } = await client.query(
    `INSERT INTO pagos_pedidos (id_pedido, monto, metodo, referencia, registrado_por)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [idPedido, monto, metodo, referencia ?? null, registradoPor ?? null],
  );
  return rows[0];
}

async function getPagosByFecha(fecha, client = db) {
  const { rows } = await client.query(
    `SELECT pp.*, p.total, u.nombre AS cliente_nombre
     FROM pagos_pedidos pp
     JOIN pedidos p ON p.id_pedido = pp.id_pedido
     JOIN usuarios u ON u.id_usuario = p.id_usuario
     WHERE DATE(pp.creado_en AT TIME ZONE 'America/Santiago') = $1
     ORDER BY pp.creado_en`,
    [fecha],
  );
  return rows;
}

module.exports = {
  findById, findByUsuario, findAll,
  create, updateEstado, updateTotal,
  getItems, addItem, removeItem,
  createPago, getPagosByFecha,
};
