const mongoose = require('mongoose');

const GoodsReceipt = require('../models/GoodsReceipt');
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');

// ==========================================
// CREATE GOODS RECEIPT
// ==========================================
exports.createGoodsReceipt = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      purchaseOrder: purchaseOrderId,
      receiptDate,
      items,
      notes,
    } = req.body;

    // Basic validation
    if (!purchaseOrderId) {
      return res.status(400).json({
        success: false,
        message: 'Purchase Order is required.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(purchaseOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Purchase Order ID.',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one received product is required.',
      });
    }

    let createdReceiptId;

    await session.withTransaction(async () => {
      // 1. Find Purchase Order
      const purchaseOrder = await PurchaseOrder.findById(
        purchaseOrderId
      ).session(session);

      if (!purchaseOrder) {
        throw new Error('Purchase Order not found.');
      }

      // Only placed orders can receive goods
      if (
        !['Ordered', 'Partially Received'].includes(
          purchaseOrder.status
        )
      ) {
        throw new Error(
          'Goods can only be received against an Ordered or Partially Received Purchase Order.'
        );
      }

      // 2. Validate supplier and products
      const orderItemMap = new Map();

      purchaseOrder.items.forEach((item) => {
        orderItemMap.set(
          item.product.toString(),
          item
        );
      });

      const receivedProductIds = new Set();

      let subtotal = 0;

      const receiptItems = [];

      for (const item of items) {
        const {
          product: productId,
          receivedQuantity,
          purchasePrice,
        } = item;

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
          throw new Error('Invalid product ID.');
        }

        if (receivedProductIds.has(productId.toString())) {
          throw new Error(
            'Duplicate products are not allowed in one Goods Receipt.'
          );
        }

        receivedProductIds.add(productId.toString());

        if (
          !Number.isInteger(Number(receivedQuantity)) ||
          Number(receivedQuantity) <= 0
        ) {
          throw new Error(
            'Received quantity must be a positive whole number.'
          );
        }

        // Product must exist in the Purchase Order
        const orderItem = orderItemMap.get(productId.toString());

        if (!orderItem) {
          throw new Error(
            'This product does not belong to the selected Purchase Order.'
          );
        }

        const pendingQuantity =
          orderItem.orderedQuantity - orderItem.receivedQuantity;

        if (Number(receivedQuantity) > pendingQuantity) {
          throw new Error(
            `You can receive only ${pendingQuantity} more units for this product.`
          );
        }

        // 3. Check product
        const product = await Product.findById(productId).session(
          session
        );

        if (!product) {
          throw new Error('Product not found.');
        }

        if (product.status !== 'Active') {
          throw new Error(
            `${product.name} is inactive and cannot be received.`
          );
        }

        // Use the supplied actual price, or PO estimated price
        const finalPurchasePrice =
          purchasePrice === undefined ||
          purchasePrice === null ||
          purchasePrice === ''
            ? orderItem.estimatedPurchasePrice
            : Number(purchasePrice);

        if (
          !Number.isFinite(finalPurchasePrice) ||
          finalPurchasePrice <= 0
        ) {
          throw new Error(
            `Invalid purchase price for ${product.name}.`
          );
        }

        const quantity = Number(receivedQuantity);
        const total = quantity * finalPurchasePrice;

        subtotal += total;

        receiptItems.push({
          product: product._id,
          receivedQuantity: quantity,
          purchasePrice: finalPurchasePrice,
          total,
        });

        // 4. Increase actual stock
        await Product.updateOne(
          { _id: product._id },
          {
            $inc: {
              quantity,
            },
          },
          { session }
        );

        // 5. Update Purchase Order received quantity
        orderItem.receivedQuantity += quantity;
      }

      // 6. Update Purchase Order status
      const allItemsReceived = purchaseOrder.items.every(
        (item) =>
          item.receivedQuantity >= item.orderedQuantity
      );

      const anyItemsReceived = purchaseOrder.items.some(
        (item) => item.receivedQuantity > 0
      );

      if (allItemsReceived) {
        purchaseOrder.status = 'Received';
      } else if (anyItemsReceived) {
        purchaseOrder.status = 'Partially Received';
      }

      await purchaseOrder.save({ session });

      // 7. Create Goods Receipt
      const goodsReceipt = new GoodsReceipt({
        purchaseOrder: purchaseOrder._id,
        supplier: purchaseOrder.supplier,
        receiptDate: receiptDate || new Date(),
        items: receiptItems,
        subtotal,
        notes: notes || '',
      });

      await goodsReceipt.save({ session });

      createdReceiptId = goodsReceipt._id;
    });

    // Fetch saved receipt after transaction completes
    const savedReceipt = await GoodsReceipt.findById(
      createdReceiptId
    )
      .populate('purchaseOrder', 'purchaseOrderNumber status')
      .populate('supplier', 'supplierName companyName')
      .populate('items.product', 'name sku');

    return res.status(201).json({
      success: true,
      message: 'Goods received successfully. Product stock has been updated.',
      data: savedReceipt,
    });
  } catch (error) {
    console.error('Create Goods Receipt Error:', error);

    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create Goods Receipt.',
    });
  } finally {
    await session.endSession();
  }
};

// ==========================================
// GET ALL GOODS RECEIPTS
// ==========================================
exports.getGoodsReceipts = async (req, res) => {
  try {
    const receipts = await GoodsReceipt.find()
      .populate('purchaseOrder', 'purchaseOrderNumber status')
      .populate('supplier', 'supplierName companyName')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: receipts.length,
      data: receipts,
    });
  } catch (error) {
    console.error('Get Goods Receipts Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Goods Receipts.',
    });
  }
};

// ==========================================
// GET GOODS RECEIPT BY ID
// ==========================================
exports.getGoodsReceiptById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Goods Receipt ID.',
      });
    }

    const receipt = await GoodsReceipt.findById(id)
      .populate('purchaseOrder', 'purchaseOrderNumber status')
      .populate('supplier', 'supplierName companyName')
      .populate('items.product', 'name sku');

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Goods Receipt not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    console.error('Get Goods Receipt Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Goods Receipt.',
    });
  }
};
