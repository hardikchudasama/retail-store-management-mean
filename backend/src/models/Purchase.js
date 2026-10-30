const mongoose = require('mongoose');
const Counter = require('./Counter');

const purchaseItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: [0, 'Purchase price cannot be negative'],
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const purchaseSchema = new mongoose.Schema(
  {
    purchaseId: {
      type: String,
      unique: true,
      index: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    supplierInvoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    purchaseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    items: {
      type: [purchaseItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message: 'At least one product is required',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, 'Amount paid cannot be negative'],
    },
    balanceDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Unpaid', 'Partial'],
      default: 'Unpaid',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Completed', 'Cancelled'],
      default: 'Completed',
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

purchaseSchema.index(
  { supplier: 1, supplierInvoiceNumber: 1 },
  { unique: true }
);

purchaseSchema.pre('save', async function () {
  if (!this.isNew || this.purchaseId) {
    return;
  }

  const year = new Date().getFullYear();
  const counterId = `purchase-${year}`;

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

  this.purchaseId = `PUR-${year}-${String(counter.sequence).padStart(4, '0')}`;
});

module.exports = mongoose.model('Purchase', purchaseSchema);
