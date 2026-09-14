const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Prescription = require('../models/Prescription');
const PaymentTransaction = require('../models/PaymentTransaction');
const { requireAuth } = require('../middleware/authMiddleware');
const { generateCSV } = require('../utils/csvExport');

// Helper to check customers.view permission for STAFF
const requireCustomerView = (req, res, next) => {
  if (req.user.role === 'STAFF' && (!req.user.permissions || !req.user.permissions.includes('customers.view'))) {
    return res.status(403).json({ message: 'Forbidden: Missing customers.view permission' });
  }
  if (req.user.role === 'CUSTOMER') {
    return res.status(403).json({ message: 'Forbidden: Customers cannot access admin APIs' });
  }
  next();
};

// @route   GET /api/customers/stats
// @desc    Get aggregate stats for customers
router.get('/stats', requireAuth, requireCustomerView, async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments({ role: 'CUSTOMER' });
    const prescriptionsSaved = await Prescription.countDocuments();
    
    // Calculate repeat rate
    // Repeat rate = (Number of customers with > 1 order) / Total customers
    const customersWithOrders = await Order.aggregate([
      { $group: { _id: '$customer', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    const totalCustomersWithAnyOrder = await Order.aggregate([
        { $group: { _id: '$customer' } }
    ]);

    const repeatRate = totalCustomersWithAnyOrder.length > 0 
      ? ((customersWithOrders.length / totalCustomersWithAnyOrder.length) * 100).toFixed(1) 
      : 0;

    res.json({
      totalCustomers,
      repeatRate: repeatRate + '%',
      prescriptionsSaved,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching customer stats' });
  }
});

// @route   GET /api/customers
// @desc    Get all customers with search and pagination
router.get('/', requireAuth, requireCustomerView, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    let query = { role: 'CUSTOMER' };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { mobileNumber: searchRegex }
      ];
      if (mongoose.Types.ObjectId.isValid(search)) {
        query.$or.push({ _id: search });
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const customers = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).select('-password');

    // Attach last order and lifetime value
    const customerIds = customers.map(c => c._id);
    const ordersStats = await Order.aggregate([
      { $match: { customer: { $in: customerIds } } },
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: '$customer',
          lastOrderNumber: { $first: '$orderNumber' },
          lastOrderDate: { $first: '$createdAt' },
          lifetimeValue: { $sum: '$totalAmount' }
      }}
    ]);

    const statsMap = {};
    ordersStats.forEach(stat => {
      statsMap[stat._id.toString()] = stat;
    });

    const enrichedCustomers = customers.map(c => {
      const stats = statsMap[c._id.toString()];
      return {
        ...c.toObject(),
        lastOrderNumber: stats?.lastOrderNumber || null,
        lastOrderDate: stats?.lastOrderDate || null,
        lifetimeValue: stats?.lifetimeValue || 0,
        preference: null // For now, could calculate based on most common shape
      };
    });

    res.json({
      customers: enrichedCustomers,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching customers' });
  }
});

// @route   GET /api/customers/export
// @desc    Export customers to CSV
router.get('/export', requireAuth, requireCustomerView, async (req, res) => {
  try {
    const { search } = req.query;
    let query = { role: 'CUSTOMER' };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { mobileNumber: searchRegex }
      ];
      if (mongoose.Types.ObjectId.isValid(search)) {
        query.$or.push({ _id: search });
      }
    }

    const customers = await User.find(query).sort({ createdAt: -1 }).select('-password');
    const customerIds = customers.map(c => c._id);
    
    const ordersStats = await Order.aggregate([
      { $match: { customer: { $in: customerIds } } },
      { $group: {
          _id: '$customer',
          totalOrders: { $sum: 1 },
          lastOrderDate: { $max: '$createdAt' },
          lifetimeValue: { $sum: '$totalAmount' }
      }}
    ]);

    const statsMap = {};
    ordersStats.forEach(stat => {
      statsMap[stat._id.toString()] = stat;
    });

    const headers = [
      'Customer ID', 'Full Name', 'Email', 'Mobile', 'Account Status', 
      'Joined Date', 'Total Orders', 'Lifetime Spend', 'Outstanding Balance', 'Last Order Date'
    ];
    
    const rows = customers.map(c => {
      const stats = statsMap[c._id.toString()] || {};
      return [
        c._id,
        c.name,
        c.email,
        c.mobileNumber,
        c.isActive ? 'Active' : 'Inactive',
        new Date(c.createdAt).toISOString(),
        stats.totalOrders || 0,
        stats.lifetimeValue || 0,
        c.outstandingBalance || 0,
        stats.lastOrderDate ? new Date(stats.lastOrderDate).toISOString() : ''
      ];
    });

    const csvData = generateCSV(headers, rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('customers.csv');
    return res.send(csvData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error exporting customers' });
  }
});

// @route   GET /api/customers/:id
// @desc    Get customer profile
router.get('/:id', requireAuth, requireCustomerView, async (req, res) => {
  try {
    const customer = await User.findById(req.params.id).select('-password');
    if (!customer || customer.role !== 'CUSTOMER') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching customer details' });
  }
});

// @route   GET /api/customers/:id/orders
// @desc    Get customer order history
router.get('/:id/orders', requireAuth, requireCustomerView, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.params.id })
      .sort({ createdAt: -1 })
      .populate('items.productId');
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching customer orders' });
  }
});

// @route   GET /api/customers/:id/prescriptions
// @desc    Get customer prescription history
router.get('/:id/prescriptions', requireAuth, requireCustomerView, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ customer: req.params.id }).sort({ date: -1 });
    res.json(prescriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching customer prescriptions' });
  }
});

// @route   POST /api/customers/:id/prescriptions
// @desc    Add a new prescription
router.post('/:id/prescriptions', requireAuth, requireCustomerView, async (req, res) => {
  try {
    const { od, os, pd, add, notes, date } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Customer not found' });

    const newPrescription = new Prescription({
      customer: user._id,
      od,
      os,
      pd,
      add,
      notes,
      date: date || Date.now()
    });

    const saved = await newPrescription.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error adding prescription' });
  }
});

// @route   PUT /api/customers/:id/prescriptions/:prescriptionId
// @desc    Update a prescription
router.put('/:id/prescriptions/:prescriptionId', requireAuth, requireCustomerView, async (req, res) => {
  try {
    const { od, os, pd, add, notes, date } = req.body;
    
    const prescription = await Prescription.findOne({ _id: req.params.prescriptionId, customer: req.params.id });
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    prescription.od = od !== undefined ? od : prescription.od;
    prescription.os = os !== undefined ? os : prescription.os;
    prescription.pd = pd !== undefined ? pd : prescription.pd;
    prescription.add = add !== undefined ? add : prescription.add;
    prescription.notes = notes !== undefined ? notes : prescription.notes;
    if (date) prescription.date = date;

    const updated = await prescription.save();
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating prescription' });
  }
});

// @route   GET /api/customers/:id/activity
// @desc    Get customer activity timeline
router.get('/:id/activity', requireAuth, requireCustomerView, async (req, res) => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    let activities = [];
    
    // Account created
    activities.push({
      type: 'ACCOUNT_CREATED',
      date: customer.createdAt,
      description: 'Account created'
    });

    // Orders placed
    const orders = await Order.find({ customer: req.params.id });
    orders.forEach(o => {
      activities.push({
        type: 'ORDER_PLACED',
        date: o.createdAt,
        description: `Order ${o.orderNumber} placed for ₹${o.totalAmount.toLocaleString('en-IN')}`,
        metadata: { orderId: o._id, orderNumber: o.orderNumber }
      });
      // Order status changes
      if (o.timeline && Array.isArray(o.timeline)) {
          o.timeline.forEach(event => {
              // Ignore initial processing event if it has same timestamp as order creation
              if (event.status !== 'PROCESSING' || new Date(event.changedAt).getTime() > new Date(o.createdAt).getTime() + 1000) {
                 activities.push({
                    type: 'ORDER_STATUS_CHANGED',
                    date: event.changedAt,
                    description: `Order ${o.orderNumber} status changed to ${event.status}`,
                    metadata: { orderId: o._id, status: event.status }
                 });
              }
          });
      }
    });

    // Prescriptions
    const prescriptions = await Prescription.find({ customer: req.params.id });
    prescriptions.forEach(p => {
      activities.push({
        type: 'PRESCRIPTION_SAVED',
        date: p.createdAt,
        description: 'New prescription saved',
        metadata: { prescriptionId: p._id }
      });
    });

    // Sort descending by date
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(activities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching customer activity' });
  }
});

// @route   GET /api/customers/:id/payments
// @desc    Get customer payment ledger history
router.get('/:id/payments', requireAuth, requireCustomerView, async (req, res) => {
  try {
    const payments = await PaymentTransaction.find({ customer: req.params.id }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching customer payments' });
  }
});

// @route   POST /api/customers/:id/payments
// @desc    Record a manual payment or adjustment
router.post('/:id/payments', requireAuth, requireCustomerView, async (req, res) => {
  try {
    const { amount, paymentMethod, notes, type = 'PAYMENT' } = req.body;
    
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Customer not found' });

    // Decrease outstanding balance (adjustments could be negative, but typically amount is positive and reduces balance)
    let amountVal = Number(amount);
    
    // If it's a payment or credit, it reduces balance. If it's a new manual charge/purchase, it increases.
    // For this UI, "Record Payment" means reducing balance.
    if (['PAYMENT', 'CREDIT'].includes(type)) {
       user.outstandingBalance = (user.outstandingBalance || 0) - amountVal;
    } else if (['PURCHASE', 'ADJUSTMENT'].includes(type)) {
       // ADJUSTMENT could be positive or negative depending on frontend, assuming positive increases balance here, or frontend sends negative
       user.outstandingBalance = (user.outstandingBalance || 0) + amountVal;
    }
    
    await user.save();

    const transaction = await PaymentTransaction.create({
      customer: user._id,
      type,
      amount: amountVal,
      outstandingAmount: user.outstandingBalance,
      paymentMethod: paymentMethod || 'Other',
      notes,
      createdBy: req.user._id
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error recording payment' });
  }
});

module.exports = router;
