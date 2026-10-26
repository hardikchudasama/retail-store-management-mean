const mongoose = require('mongoose');
const Supplier = require('../models/Supplier');

const supplierFields = [
  'supplierName',
  'companyName',
  'phone',
  'email',
  'address',
  'city',
  'state',
  'postalCode',
  'notes',
  'status',
];

const getDuplicateField = (error) => {
  const field = Object.keys(error.keyPattern || error.keyValue || {})[0];
  return field === 'phone' || field === 'email' ? field : 'Supplier';
};

const isInvalidObjectId = (id) => !mongoose.isObjectIdOrHexString(id);

const isInvalidSupplierBody = (body) =>
  !body || typeof body !== 'object' || Array.isArray(body);

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: suppliers.length,
      data: suppliers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers',
      error: error.message,
    });
  }
};

const getSupplierById = async (req, res) => {
  if (isInvalidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid supplier ID',
    });
  }

  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier',
      error: error.message,
    });
  }
};

const createSupplier = async (req, res) => {
  if (isInvalidSupplierBody(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Supplier data must be a JSON object',
    });
  }

  try {
    const supplierData = Object.fromEntries(
      supplierFields
        .filter((field) => req.body[field] !== undefined)
        .map((field) => [field, req.body[field]])
    );

    if (typeof supplierData.email === 'string' && !supplierData.email.trim()) {
      delete supplierData.email;
    }

    const supplier = await Supplier.create(supplierData);

    return res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `${getDuplicateField(error)} already exists`,
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
      message: 'Failed to create supplier',
      error: error.message,
    });
  }
};

const updateSupplier = async (req, res) => {
  if (isInvalidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid supplier ID',
    });
  }

  if (isInvalidSupplierBody(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Supplier data must be a JSON object',
    });
  }

  try {
    const updates = Object.fromEntries(
      supplierFields
        .filter((field) => req.body[field] !== undefined)
        .map((field) => [field, req.body[field]])
    );
    const updateQuery = { $set: updates };

    if (typeof updates.email === 'string' && !updates.email.trim()) {
      delete updateQuery.$set.email;
      updateQuery.$unset = { email: 1 };
    }

    const supplier = await Supplier.findByIdAndUpdate(req.params.id, updateQuery, {
      new: true,
      runValidators: true,
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `${getDuplicateField(error)} already exists`,
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
      message: 'Failed to update supplier',
      error: error.message,
    });
  }
};

const deleteSupplier = async (req, res) => {
  if (isInvalidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid supplier ID',
    });
  }

  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully',
      data: supplier,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete supplier',
      error: error.message,
    });
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
