const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const Frame = require('../models/Frame');
const LensInventory = require('../models/LensInventory');
const User = require('../models/User');
const { generateCSV } = require('../utils/csvExport');

const router = express.Router();

// Helper to check reports.view permission for STAFF
const requireReportsView = (req, res, next) => {
  if (req.user.role === 'ADMIN') return next();
  if (req.user.role === 'STAFF' && (!req.user.permissions || !req.user.permissions.includes('reports.view'))) {
    return res.status(403).json({ message: 'Forbidden: Missing reports.view permission' });
  }
  if (req.user.role === 'CUSTOMER') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

// @route   GET /api/reports/export
// @desc    Export various reports to CSV
router.get('/export', requireAuth, requireReportsView, async (req, res) => {
  try {
    const { type } = req.query; // sales, products, lens, customers

    if (!type || !['sales', 'products', 'lens', 'customers'].includes(type)) {
      return res.status(400).json({ message: 'Invalid report type' });
    }

    let headers = [];
    let rows = [];
    let filename = `${type}_report.csv`;

    if (type === 'sales') {
      const orders = await Order.find({ orderStatus: { $ne: 'CANCELLED' } }).sort({ createdAt: -1 });
      headers = ['Order Number', 'Date', 'Gross Revenue', 'Discounts', 'Tax', 'Shipping', 'Net Revenue', 'Outstanding'];
      rows = orders.map(o => [
        o.orderNumber,
        new Date(o.createdAt).toISOString(),
        o.subtotal || 0,
        o.discount || 0,
        o.tax || 0,
        o.shipping || 0,
        o.totalAmount || 0,
        o.outstanding || 0
      ]);
    } else if (type === 'products') {
      const frames = await Frame.find().sort({ createdAt: -1 });
      headers = ['Product Code', 'Name', 'Category', 'Price', 'Stock', 'Status'];
      rows = frames.map(f => [
        f.code,
        f.name,
        f.category,
        f.price,
        f.stock,
        f.status
      ]);
    } else if (type === 'lens') {
      const lenses = await LensInventory.find().populate('dealer').sort({ updatedAt: -1 });
      headers = ['Material', 'Variant', 'Stock', 'Threshold', 'Dealer'];
      rows = lenses.map(l => [
        l.material,
        l.variant,
        l.currentStock,
        l.threshold,
        l.dealer ? l.dealer.name : 'Unknown'
      ]);
    } else if (type === 'customers') {
      const customers = await User.find({ role: 'CUSTOMER' }).sort({ createdAt: -1 });
      headers = ['Customer ID', 'Name', 'Email', 'Mobile', 'Joined'];
      rows = customers.map(c => [
        c._id,
        c.name,
        c.email,
        c.mobileNumber,
        new Date(c.createdAt).toISOString()
      ]);
    }

    const csvData = generateCSV(headers, rows);
    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    return res.send(csvData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating report' });
  }
});

module.exports = router;
