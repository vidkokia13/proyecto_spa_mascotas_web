'use strict';

const pedidoRepo   = require('../repositories/pedidoRepository');
const productoRepo = require('../repositories/productoRepository');
const notifRepo    = require('../repositories/notificacionRepository');
const notifSvc     = require('./notificationService');
const AppError     = require('../utils/AppError');
const db           = require('../config/db');
const logger       = require('../config/logger');

async function notificarBajoStockAsync(productos) {
  try {
    const admins = await notifRepo.getAdminEmails();
    if (!admins.length) return;
    for (const p of productos) {
      const yaNotificado = await notifRepo.bajoStockReciente(p.id_producto);
      if (yaNotificado) continue;
      try {
        await notifSvc.notificarBajoStock(p, admins);
        // Solo marcar si el email se envió exitosamente
        await notifRepo.marcarEnviada('bajo_stock', String(p.id_producto), admins.map(a => a.email).join(', '));
        logger.info(`Alerta bajo stock enviada para: ${p.nombre}`);
      } catch (err) {
        logger.error(`Error notif bajo stock ${p.nombre}`, { error: err.message });
      }
    }
  } catch (err) {
    logger.error('Error en notificarBajoStockAsync', { error: err.message });
  }
}

async function crearPedido({ idUsuario, items, notas, metodoPago = null, referenciaPago = null, completarInmediatamente = false }) {
  if (!items || items.length === 0) {
    throw new AppError('El pedido debe tener al menos un producto.', 400, 'EMPTY_ORDER');
  }

  // Estado según el flujo:
  // completarInmediatamente=true (recepcion, venta directa)  → 'completado' + pago en caja
  // metodoPago informado (cliente seleccionó cómo pagar)     → 'enviado' (recepcion confirma)
  // sin metodoPago (borrador)                                → 'borrador'
  const estadoInicial = completarInmediatamente ? 'completado' : (metodoPago ? 'enviado' : 'borrador');

  const productosConBajoStock = [];

  const result = await db.withTransaction(async (client) => {
    const pedido = await pedidoRepo.create({
      idUsuario,
      notas,
      metodoPago:    metodoPago    ?? null,
      referenciaPago: referenciaPago ?? null,
      estado:        estadoInicial,
    }, client);

    let total = 0;
    for (const item of items) {
      const producto = await productoRepo.findById(item.idProducto, client);
      if (!producto || !producto.activo) {
        throw new AppError(`Producto no disponible: ${item.idProducto}`, 400, 'PRODUCT_UNAVAILABLE');
      }
      if (producto.stock < item.cantidad) {
        throw new AppError(`Stock insuficiente para: ${producto.nombre}`, 400, 'INSUFFICIENT_STOCK');
      }

      const actualizado = await productoRepo.descontarStock(item.idProducto, item.cantidad, client);
      if (actualizado && Number(actualizado.stock) <= Number(actualizado.stock_minimo)) {
        productosConBajoStock.push(actualizado);
      }

      await pedidoRepo.addItem({
        idPedido:       pedido.id_pedido,
        idProducto:     item.idProducto,
        cantidad:       item.cantidad,
        precioUnitario: producto.precio,
      }, client);

      total += Number(producto.precio) * item.cantidad;
    }

    const pedidoFinal = await pedidoRepo.updateTotal(pedido.id_pedido, total, client);

    // Venta directa de recepción: registrar pago en caja dentro de la misma transacción
    if (completarInmediatamente && metodoPago) {
      await pedidoRepo.createPago({
        idPedido:      pedidoFinal.id_pedido,
        monto:         total,
        metodo:        metodoPago,
        referencia:    referenciaPago ?? null,
        registradoPor: idUsuario,
      }, client);
    }

    const itemsGuardados = await pedidoRepo.getItems(pedidoFinal.id_pedido, client);
    return { pedido: pedidoFinal, items: itemsGuardados };
  });

  if (productosConBajoStock.length > 0) {
    notificarBajoStockAsync(productosConBajoStock);
  }

  return result;
}

async function getPedido(idPedido, idUsuario, rol) {
  const pedido = await pedidoRepo.findById(idPedido);
  if (!pedido) throw new AppError('Pedido no encontrado.', 404, 'NOT_FOUND');

  const esInterno = ['admin', 'jefe', 'recepcion'].includes(rol);
  if (!esInterno && pedido.id_usuario !== idUsuario) {
    throw new AppError('Sin acceso a este pedido.', 403, 'FORBIDDEN');
  }

  const items = await pedidoRepo.getItems(idPedido);
  return { pedido, items };
}

async function listarMisPedidos(idUsuario) {
  return pedidoRepo.findByUsuario(idUsuario);
}

async function listarTodos(filtros) {
  return pedidoRepo.findAll(filtros);
}

async function cambiarEstado(idPedido, estado, { metodo, referencia, idUsuario } = {}) {
  const ESTADOS = ['borrador', 'enviado', 'completado', 'cancelado'];
  if (!ESTADOS.includes(estado)) throw new AppError('Estado inválido.', 400, 'INVALID_STATE');

  const pedido = await pedidoRepo.findById(idPedido);
  if (!pedido) throw new AppError('Pedido no encontrado.', 404, 'NOT_FOUND');

  const updated = await pedidoRepo.updateEstado(idPedido, estado);

  // Al completar, registrar el pago para que aparezca en caja
  if (estado === 'completado') {
    const metodoPago = metodo || 'efectivo';
    await pedidoRepo.createPago({
      idPedido,
      monto:         pedido.total,
      metodo:        metodoPago,
      referencia:    referencia ?? null,
      registradoPor: idUsuario ?? null,
    });
  }

  return updated;
}

// Genera link de WhatsApp con el resumen del pedido
async function generarLinkWhatsApp(idPedido, telefono) {
  const { pedido, items } = await getPedido(idPedido, null, 'recepcion');

  const lineas = items.map(i =>
    `• ${i.nombre} x${i.cantidad} = Bs ${(i.subtotal).toFixed(2)}`,
  ).join('\n');

  const mensaje = encodeURIComponent(
    `🐾 *Pedido Pet Spa #${idPedido.slice(-6).toUpperCase()}*\n\n${lineas}\n\n*Total: Bs ${Number(pedido.total).toFixed(2)}*`,
  );

  const num = (telefono || '').replace(/\D/g, '');
  return `https://wa.me/${num}?text=${mensaje}`;
}

module.exports = { crearPedido, getPedido, listarMisPedidos, listarTodos, cambiarEstado, generarLinkWhatsApp };
