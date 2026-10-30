const express = require('express');

const {
  getPurchases,
  getPurchaseById,
  createPurchase,
  cancelPurchase,
} = require('../controllers/purchaseController');

const router = express.Router();

router.get('/', getPurchases);
router.get('/:id', getPurchaseById);
router.post('/', createPurchase);
router.patch('/:id/cancel', cancelPurchase);

module.exports = router;
