const express = require('express');
const cors = require('cors');

const app = express();
const productRoutes = require('./routes/productRoutes');
const supplierRoutes = require('./routes/supplierRoutes');

// Middleware
app.use(cors({
  origin: 'http://localhost:4200'
}));

app.use(express.json());


// Health check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Retail Store Management API is running!'
  });
});

app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);

module.exports = app;