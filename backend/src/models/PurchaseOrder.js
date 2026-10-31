const mongoose = require('mongoose');
const Counter = require('./Counter');

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    orderedQuantity: {
      type: Number,
      required: true,
      min: [1, 'Ordered quantity must be at least 1'],
    },
    estimatedPurchasePrice: {
      type: Number,
      required: true,
      min: [0.01, 'Purchase price must be greater than zero'],
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    receivedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    purchaseOrderNumber: {
      type: String,
      unique: true,
      index: true,
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },

    orderDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    expectedDeliveryDate: {
      type: Date,
      default: null,
    },

    items: {
      type: [purchaseOrderItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message: 'At least one product is required.',
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

    status: {
      type: String,
      enum: [
        'Draft',
        'Ordered',
        'Partially Received',
        'Received',
        'Cancelled',
      ],
      default: 'Draft',
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Generate a unique Purchase Order Number.
purchaseOrderSchema.pre('save', async function () {
  if (!this.isNew || this.purchaseOrderNumber) {
    return;
  }

  const year = new Date().getFullYear();
  const counterId = `purchase-order-${year}`;

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

  this.purchaseOrderNumber =
    `PO-${year}-${String(counter.sequence).padStart(4, '0')}`;
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
