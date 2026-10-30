const mongoose = require('mongoose');

const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

const roundMoney = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

exports.createPurchase = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      supplier,
      supplierInvoiceNumber,
      purchaseDate,
      dueDate,
      items,
      discount = 0,
      amountPaid = 0,
      notes = '',
    } = req.body;

    if (!supplier || !supplierInvoiceNumber?.trim()) {
      return res.status(400).json({
        message: 'Supplier and supplier invoice number are required.',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'At least one purchase item is required.',
      });
    }

    if (!mongoose.isValidObjectId(supplier)) {
      return res.status(400).json({ message: 'Invalid supplier ID.' });
    }

    const normalizedDiscount = Number(discount);
    const normalizedAmountPaid = Number(amountPaid);

    if (
      !Number.isFinite(normalizedDiscount) ||
      !Number.isFinite(normalizedAmountPaid) ||
      normalizedDiscount < 0 ||
      normalizedAmountPaid < 0
    ) {
      return res.status(400).json({
        message: 'Discount and amount paid must be valid non-negative amounts.',
      });
    }

    const productIds = items.map((item) => String(item.product));

    if (new Set(productIds).size !== productIds.length) {
      return res.status(400).json({
        message: 'A product can appear only once in a purchase. Combine its quantity.',
      });
    }

    let createdPurchase;

    await session.withTransaction(async () => {
      const supplierExists = await Supplier.findOne({
        _id: supplier,
        status: 'Active',
      }).session(session);

      if (!supplierExists) {
        throw new Error('ACTIVE_SUPPLIER_NOT_FOUND');
      }

      let subtotal = 0;
      const purchaseItems = [];

      for (const item of items) {
        if (!mongoose.isValidObjectId(item.product)) {
          throw new Error('INVALID_PRODUCT_ID');
        }

        const quantity = Number(item.quantity);
        const purchasePrice = Number(item.purchasePrice);

        if (
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          !Number.isFinite(purchasePrice) ||
          purchasePrice < 0
        ) {
          throw new Error('INVALID_PURCHASE_ITEM');
        }

        const product = await Product.findOne({
          _id: item.product,
          status: 'Active',
        }).session(session);

        if (!product) {
          throw new Error('ACTIVE_PRODUCT_NOT_FOUND');
        }

        const itemTotal = roundMoney(quantity * purchasePrice);
        subtotal = roundMoney(subtotal + itemTotal);

        purchaseItems.push({
          product: product._id,
          quantity,
          purchasePrice,
          total: itemTotal,
        });
      }

      const grandTotal = roundMoney(subtotal - normalizedDiscount);

      if (normalizedDiscount > subtotal) {
        throw new Error('DISCOUNT_EXCEEDS_SUBTOTAL');
      }

      if (normalizedAmountPaid > grandTotal) {
        throw new Error('AMOUNT_PAID_EXCEEDS_TOTAL');
      }

      const balanceDue = roundMoney(grandTotal - normalizedAmountPaid);
      const paymentStatus =
        balanceDue === 0
          ? 'Paid'
          : normalizedAmountPaid === 0
            ? 'Unpaid'
            : 'Partial';

      for (const item of purchaseItems) {
        const result = await Product.updateOne(
          { _id: item.product, status: 'Active' },
          { $inc: { quantity: item.quantity } },
          { session }
        );

        if (result.matchedCount !== 1) {
          throw new Error('PRODUCT_STOCK_UPDATE_FAILED');
        }
      }

      const purchase = new Purchase({
        supplier,
        supplierInvoiceNumber: supplierInvoiceNumber.trim(),
        purchaseDate: purchaseDate || new Date(),
        dueDate: dueDate || null,
        items: purchaseItems,
        subtotal,
        discount: normalizedDiscount,
        grandTotal,
        amountPaid: normalizedAmountPaid,
        balanceDue,
        paymentStatus,
        notes,
      });

      await purchase.save({ session });
      createdPurchase = purchase;
    });

    return res.status(201).json({
      message: 'Purchase created successfully.',
      purchase: createdPurchase,
    });
  } catch (error) {
    console.error('Create purchase error:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: 'This invoice number has already been recorded for this supplier.',
      });
    }

    const errors = {
      ACTIVE_SUPPLIER_NOT_FOUND: 'Supplier not found or inactive.',
      INVALID_PRODUCT_ID: 'One or more product IDs are invalid.',
      INVALID_PURCHASE_ITEM: 'Product quantity or purchase price is invalid.',
      ACTIVE_PRODUCT_NOT_FOUND: 'One or more products are unavailable or inactive.',
      DISCOUNT_EXCEEDS_SUBTOTAL: 'Discount cannot exceed the purchase subtotal.',
      AMOUNT_PAID_EXCEEDS_TOTAL: 'Amount paid cannot exceed the grand total.',
      PRODUCT_STOCK_UPDATE_FAILED: 'Could not update product stock.',
    };

    if (errors[error.message]) {
      return res.status(400).json({ message: errors[error.message] });
    }

    return res.status(500).json({ message: 'Failed to create purchase.' });
  } finally {
    await session.endSession();
  }
};

exports.getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('supplier', 'supplierName companyName phone')
      .populate('items.product', 'name sku category')
      .sort({ createdAt: -1 });

    return res.status(200).json({ count: purchases.length, purchases });
  } catch (error) {
    console.error('Get purchases error:', error);
    return res.status(500).json({ message: 'Failed to retrieve purchases.' });
  }
};

exports.getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplier', 'supplierName companyName phone email')
      .populate('items.product', 'name sku category');

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found.' });
    }

    return res.status(200).json({ purchase });
  } catch (error) {
    console.error('Get purchase details error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid purchase ID.' });
    }

    return res.status(500).json({ message: 'Failed to retrieve purchase details.' });
  }
};

exports.cancelPurchase = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { cancellationReason } = req.body;

    if (!cancellationReason?.trim()) {
      return res.status(400).json({ message: 'Cancellation reason is required.' });
    }

    let cancelledPurchase;

    await session.withTransaction(async () => {
      const purchase = await Purchase.findById(req.params.id).session(session);

      if (!purchase) {
        throw new Error('PURCHASE_NOT_FOUND');
      }

      if (purchase.status === 'Cancelled') {
        throw new Error('PURCHASE_ALREADY_CANCELLED');
      }

      for (const item of purchase.items) {
        const result = await Product.updateOne(
          { _id: item.product, quantity: { $gte: item.quantity } },
          { $inc: { quantity: -item.quantity } },
          { session }
        );

        if (result.matchedCount !== 1) {
          throw new Error('INSUFFICIENT_STOCK_TO_CANCEL');
        }
      }

      purchase.status = 'Cancelled';
      purchase.cancelledAt = new Date();
      purchase.cancellationReason = cancellationReason.trim();

      await purchase.save({ session });
      cancelledPurchase = purchase;
    });

    return res.status(200).json({
      message: 'Purchase cancelled and stock reversed successfully.',
      purchase: cancelledPurchase,
    });
  } catch (error) {
    console.error('Cancel purchase error:', error);

    const errors = {
      PURCHASE_NOT_FOUND: [404, 'Purchase not found.'],
      PURCHASE_ALREADY_CANCELLED: [400, 'This purchase is already cancelled.'],
      INSUFFICIENT_STOCK_TO_CANCEL: [
        400,
        'Stock is insufficient to reverse this purchase. Resolve the inventory discrepancy first.',
      ],
    };

    if (errors[error.message]) {
      return res.status(errors[error.message][0]).json({
        message: errors[error.message][1],
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid purchase ID.' });
    }

    return res.status(500).json({ message: 'Failed to cancel purchase.' });
  } finally {
    await session.endSession();
  }
};
