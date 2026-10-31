const mongoose = require('mongoose');

const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const validateItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('At least one product is required.');
  }

  const productIds = items.map((item) => String(item.product));

  if (productIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    throw new Error('One or more product IDs are invalid.');
  }

  if (new Set(productIds).size !== productIds.length) {
    throw new Error('Duplicate products are not allowed.');
  }

  return items.map((item) => {
    const orderedQuantity = Number(item.orderedQuantity);
    const estimatedPurchasePrice = Number(item.estimatedPurchasePrice);

    if (!Number.isInteger(orderedQuantity) || orderedQuantity < 1) {
      throw new Error('Ordered quantity must be a positive whole number.');
    }

    if (!Number.isFinite(estimatedPurchasePrice) || estimatedPurchasePrice <= 0) {
      throw new Error('Estimated purchase price must be greater than zero.');
    }

    return {
      product: item.product,
      orderedQuantity,
      estimatedPurchasePrice: roundMoney(estimatedPurchasePrice),
      total: roundMoney(orderedQuantity * estimatedPurchasePrice),
      receivedQuantity: 0,
    };
  });
};

const validateSupplierAndProducts = async (supplierId, items) => {
  if (!mongoose.Types.ObjectId.isValid(supplierId)) {
    throw new Error('Invalid supplier.');
  }

  const supplier = await Supplier.findOne({
    _id: supplierId,
    status: 'Active',
  });

  if (!supplier) {
    throw new Error('Active supplier not found.');
  }

  const productIds = items.map((item) => item.product);

  const products = await Product.find({
    _id: { $in: productIds },
    status: 'Active',
  });

  if (products.length !== productIds.length) {
    throw new Error('One or more products are inactive or not found.');
  }
};

const calculateSubtotal = (items) =>
  roundMoney(items.reduce((sum, item) => sum + item.total, 0));

// Create Purchase Order as Draft
const createPurchaseOrder = async (req, res) => {
  try {
    const { supplier, expectedDeliveryDate, items, notes, orderDate } = req.body;

    const validatedItems = validateItems(items);

    await validateSupplierAndProducts(supplier, validatedItems);

    const purchaseOrder = await PurchaseOrder.create({
      supplier,
      orderDate: orderDate || new Date(),
      expectedDeliveryDate: expectedDeliveryDate || null,
      items: validatedItems,
      subtotal: calculateSubtotal(validatedItems),
      notes: notes || '',
      status: 'Draft',
    });

    const populatedOrder = await PurchaseOrder.findById(purchaseOrder._id)
      .populate('supplier', 'supplierName companyName phone')
      .populate('items.product', 'name sku purchasePrice');

    return res.status(201).json({
      success: true,
      message: 'Purchase Order saved as Draft successfully.',
      data: populatedOrder,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all Purchase Orders
const getPurchaseOrders = async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find()
      .populate('supplier', 'supplierName companyName phone')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: purchaseOrders.length,
      data: purchaseOrders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Purchase Orders.',
    });
  }
};

// Get one Purchase Order
const getPurchaseOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Purchase Order ID.',
      });
    }

    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('supplier', 'supplierName companyName phone email')
      .populate('items.product', 'name sku purchasePrice quantity');

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase Order not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Purchase Order.',
    });
  }
};

// Edit Draft Purchase Order only
const updateDraftPurchaseOrder = async (req, res) => {
  try {
    const { supplier, expectedDeliveryDate, items, notes, orderDate } = req.body;

    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase Order not found.',
      });
    }

    if (purchaseOrder.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Only Draft Purchase Orders can be edited.',
      });
    }

    const validatedItems = validateItems(items);

    await validateSupplierAndProducts(supplier, validatedItems);

    purchaseOrder.supplier = supplier;
    purchaseOrder.orderDate = orderDate || purchaseOrder.orderDate;
    purchaseOrder.expectedDeliveryDate = expectedDeliveryDate || null;
    purchaseOrder.items = validatedItems;
    purchaseOrder.subtotal = calculateSubtotal(validatedItems);
    purchaseOrder.notes = notes || '';

    await purchaseOrder.save();

    const updatedOrder = await PurchaseOrder.findById(purchaseOrder._id)
      .populate('supplier', 'supplierName companyName phone')
      .populate('items.product', 'name sku purchasePrice');

    return res.status(200).json({
      success: true,
      message: 'Draft Purchase Order updated successfully.',
      data: updatedOrder,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Place Purchase Order and lock it
const placePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase Order not found.',
      });
    }

    if (purchaseOrder.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Only Draft Purchase Orders can be placed.',
      });
    }

    purchaseOrder.status = 'Ordered';
    await purchaseOrder.save();

    return res.status(200).json({
      success: true,
      message: 'Purchase Order placed successfully. It is now locked.',
      data: purchaseOrder,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Cancel Purchase Order if nothing has been received
const cancelPurchaseOrder = async (req, res) => {
  try {
    const { cancellationReason } = req.body;

    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase Order not found.',
      });
    }

    if (!['Draft', 'Ordered'].includes(purchaseOrder.status)) {
      return res.status(400).json({
        success: false,
        message: 'This Purchase Order cannot be cancelled.',
      });
    }

    const hasReceivedGoods = purchaseOrder.items.some(
      (item) => item.receivedQuantity > 0
    );

    if (hasReceivedGoods) {
      return res.status(400).json({
        success: false,
        message: 'Goods have already been received. This Purchase Order cannot be cancelled.',
      });
    }

    purchaseOrder.status = 'Cancelled';
    purchaseOrder.cancelledAt = new Date();
    purchaseOrder.cancellationReason = cancellationReason || '';

    await purchaseOrder.save();

    return res.status(200).json({
      success: true,
      message: 'Purchase Order cancelled successfully.',
      data: purchaseOrder,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updateDraftPurchaseOrder,
  placePurchaseOrder,
  cancelPurchaseOrder,
};
