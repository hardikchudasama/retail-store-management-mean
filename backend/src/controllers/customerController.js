const mongoose = require('mongoose');
const Customer = require('../models/Customer');

const customerFields = [
  'customerName',
  'phone',
  'email',
  'address',
  'city',
  'state',
  'postalCode',
  'notes',
  'status',
];

const handleError = (res, error) => {
  console.error('Customer API Error:', error);

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || error.keyValue || {})[0];

    return res.status(409).json({
      success: false,
      message: field === 'phone'
        ? 'Phone number already exists'
        : 'Email address already exists',
    });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: Object.values(error.errors)
        .map((item) => item.message)
        .join(', '),
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};

const isInvalidBody = (body) => !body || typeof body !== 'object' || Array.isArray(body);
const isInvalidCustomerId = (id) => !mongoose.isObjectIdOrHexString(id);

const getCustomerData = (body) => Object.fromEntries(
  customerFields
    .filter((field) => body[field] !== undefined)
    .map((field) => [field, body[field]])
);

exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getCustomerById = async (req, res) => {
  if (isInvalidCustomerId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid customer ID',
    });
  }

  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.createCustomer = async (req, res) => {
  if (isInvalidBody(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Customer data must be a JSON object',
    });
  }

  try {
    const customerData = getCustomerData(req.body);
    if (typeof customerData.email === 'string' && !customerData.email.trim()) {
      delete customerData.email;
    }

    const customer = await Customer.create(customerData);

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.updateCustomer = async (req, res) => {
  if (isInvalidCustomerId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid customer ID',
    });
  }

  if (isInvalidBody(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Customer data must be a JSON object',
    });
  }

  try {
    const updates = getCustomerData(req.body);
    const updateQuery = { $set: updates };

    if (typeof updates.email === 'string' && !updates.email.trim()) {
      delete updateQuery.$set.email;
      updateQuery.$unset = { email: 1 };
    }

    const customer = await Customer.findByIdAndUpdate(req.params.id, updateQuery, {
      new: true,
      runValidators: true,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.deleteCustomer = async (req, res) => {
  if (isInvalidCustomerId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid customer ID',
    });
  }

  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    return handleError(res, error);
  }
};