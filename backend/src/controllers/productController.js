const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

// @desc    Create a new product
// @route   POST /api/products
const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      purchasePrice,
      sellingPrice,
      quantity,
      minimumStock,
      description,
    } = req.body;

    if (
      !name ||
      !sku ||
      !category ||
      purchasePrice == null ||
      sellingPrice == null ||
      quantity == null ||
      minimumStock == null
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    if (Number(sellingPrice) < Number(purchasePrice)) {
      return res.status(400).json({
        success: false,
        message: 'Selling price cannot be lower than purchase price',
      });
    }

    const normalizedSku = sku.trim().toUpperCase();
    const existingProduct = await Product.findOne({ sku: normalizedSku });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: 'Product with this SKU already exists',
      });
    }

    const product = await Product.create({
      name,
      sku,
      category,
      purchasePrice,
      sellingPrice,
      quantity,
      minimumStock,
      description,
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Product with this SKU already exists',
      });
    }

    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message,
    });
  }
};

// @desc    Update an existing product
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      purchasePrice,
      sellingPrice,
      quantity,
      minimumStock,
      description,
      status,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const finalPurchasePrice = purchasePrice ?? product.purchasePrice;
    const finalSellingPrice = sellingPrice ?? product.sellingPrice;

    if (Number(finalSellingPrice) < Number(finalPurchasePrice)) {
      return res.status(400).json({
        success: false,
        message: 'Selling price cannot be lower than purchase price',
      });
    }

    if (sku) {
      const existingProduct = await Product.findOne({
        sku: sku.trim().toUpperCase(),
        _id: { $ne: product._id },
      });

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: 'Product with this SKU already exists',
        });
      }
    }

    const updates = {
      name,
      sku,
      category,
      purchasePrice,
      sellingPrice,
      quantity,
      minimumStock,
      description,
      status,
    };
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      Object.fromEntries(
        Object.entries(updates).filter(([, value]) => value !== undefined)
      ),
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Product with this SKU already exists',
      });
    }

    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message,
    });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message,
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
