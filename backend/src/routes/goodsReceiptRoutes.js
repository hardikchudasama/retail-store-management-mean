const express = require('express');

const {
  createGoodsReceipt,
  getGoodsReceipts,
  getGoodsReceiptById,
} = require('../controllers/goodsReceiptController');

const router = express.Router();

// Get all Goods Receipts
router.get('/', getGoodsReceipts);

// Get one Goods Receipt by ID
router.get('/:id', getGoodsReceiptById);

// Create Goods Receipt
router.post('/', createGoodsReceipt);

module.exports = router;
