const express = require('express');

const {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updateDraftPurchaseOrder,
  placePurchaseOrder,
  cancelPurchaseOrder,
} = require('../controllers/purchaseOrderController');

const router = express.Router();

router.get('/', getPurchaseOrders);
router.get('/:id', getPurchaseOrderById);
router.post('/', createPurchaseOrder);
router.patch('/:id', updateDraftPurchaseOrder);
router.patch('/:id/place-order', placePurchaseOrder);
router.patch('/:id/cancel', cancelPurchaseOrder);

module.exports = router;
