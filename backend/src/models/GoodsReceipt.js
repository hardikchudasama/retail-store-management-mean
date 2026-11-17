const mongoose = require('mongoose');
const Counter = require('./Counter');

const goodsReceiptItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    receivedQuantity: {
      type: Number,
      required: true,
      min: [1, 'Received quantity must be at least 1'],
    },

    purchasePrice: {
      type: Number,
      required: true,
      min: [0.01, 'Purchase price must be greater than zero'],
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const goodsReceiptSchema = new mongoose.Schema(
  {
    goodsReceiptNumber: {
      type: String,
      unique: true,
      index: true,
    },

    purchaseOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: true,
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },

    receiptDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    items: {
      type: [goodsReceiptItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message: 'At least one received product is required.',
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Generate GR number: GR-2026-0001
goodsReceiptSchema.pre('save', async function () {
  if (!this.isNew || this.goodsReceiptNumber) {
    return;
  }

  const year = new Date().getFullYear();
  const counterId = `goods-receipt-${year}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { sequence: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      session: this.$session(),
    }
  );

  this.goodsReceiptNumber =
    `GR-${year}-${String(counter.sequence).padStart(4, '0')}`;
});

module.exports = mongoose.model('GoodsReceipt', goodsReceiptSchema);
