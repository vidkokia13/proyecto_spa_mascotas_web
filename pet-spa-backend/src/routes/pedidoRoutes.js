'use strict';

const { Router }         = require('express');
const authRequired       = require('../middlewares/authRequired');
const requireRole        = require('../middlewares/requireRole');
const validate           = require('../middlewares/validate');
const asyncHandler       = require('../utils/asyncHandler');
const pedidoController   = require('../controllers/pedidoController');
const pedidoValidators   = require('../validators/pedidoValidators');

const router = Router();
router.use(authRequired);

const soloInterno = requireRole('admin', 'jefe', 'recepcion');

// Cliente: ver sus propios pedidos y crear uno nuevo
router.get('/mis-pedidos',  asyncHandler(pedidoController.misPedidos));
router.post('/',            validate(pedidoValidators.create, 'body'), asyncHandler(pedidoController.crear));

// Interno (admin/jefe/recepcion): ver todos los pedidos y cambiar estado
router.get('/',              soloInterno, asyncHandler(pedidoController.listarTodos));
router.patch('/:id/estado',
  soloInterno,
  validate(pedidoValidators.idParam, 'params'),
  validate(pedidoValidators.cambiarEstado, 'body'),
  asyncHandler(pedidoController.cambiarEstado),
);

// Link de WhatsApp (recepcion/admin/jefe)
router.get('/:id/whatsapp',
  soloInterno,
  validate(pedidoValidators.idParam, 'params'),
  asyncHandler(pedidoController.whatsapp),
);

// Ver detalle de un pedido (cliente ve el suyo, interno ve cualquiera)
router.get('/:id', validate(pedidoValidators.idParam, 'params'), asyncHandler(pedidoController.getOne));

module.exports = router;
