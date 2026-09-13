const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Order = require('../models/Order');
const Frame = require('../models/Frame');
const { requireAuth, requireRole, requirePermission } = require('../middleware/authMiddleware');

// @route   GET /api/orders
// @desc    Get all orders (Customer gets own, Admin/Staff gets all based on permissions)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20, tab } = req.query;
    
    let query = {};

    // Customer scoping
    if (req.user.role === 'CUSTOMER') {
      query.customer = req.user._id;
    } else {
      // Admin/Staff need orders.view permission
      if (req.user.role === 'STAFF' && (!req.user.permissions || !req.user.permissions.includes('orders.view'))) {
        return res.status(403).json({ message: 'Forbidden: Missing orders.view permission' });
      }
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { orderNumber: searchRegex },
        { customerName: searchRegex },
        { customerEmail: searchRegex },
        { customerMobile: searchRegex }
      ];
    }

    if (status) {
      query.orderStatus = status;
    } else if (tab) {
      if (tab === 'Processing') query.orderStatus = 'PROCESSING';
      if (tab === 'Ready') query.orderStatus = { $in: ['PACKED', 'READY_FOR_PICKUP'] };
      if (tab === 'Returns') query.orderStatus = { $in: ['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_RECEIVED', 'REFUND_PENDING', 'RETURN_PICKED_UP'] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));

    // Also get dynamic counts for Admin/Staff
    let counts = { toFulfil: 0, ready: 0, returns: 0, all: 0 };
    if (req.user.role !== 'CUSTOMER') {
      const baseQuery = req.user.role === 'CUSTOMER' ? { customer: req.user._id } : {};
      const allStats = await Order.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
      ]);
      
      allStats.forEach(stat => {
        counts.all += stat.count;
        if (stat._id === 'PROCESSING') counts.toFulfil += stat.count;
        if (['PACKED', 'READY_FOR_PICKUP'].includes(stat._id)) counts.ready += stat.count;
        if (['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_RECEIVED', 'REFUND_PENDING', 'RETURN_PICKED_UP'].includes(stat._id)) counts.returns += stat.count;
      });
    }

    res.json({
      orders,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      counts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order details
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email mobile role')
      .populate('items.productId');
      
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Scoping
    if (req.user.role === 'CUSTOMER' && order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    } else if (req.user.role === 'STAFF' && (!req.user.permissions || !req.user.permissions.includes('orders.view'))) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching order' });
  }
});

// @route   POST /api/orders
// @desc    Create an order (Checkout)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { items, shippingAddress, billingAddress, notes } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain items' });
    }

    let subtotal = 0;
    let validatedItems = [];

    // 1. Fetch products and validate stock/prices
    for (const item of items) {
      // Need to handle if item.productId is a real ObjectId vs the dummy string id from the mock data
      let frame;
      if (mongoose.Types.ObjectId.isValid(item.productId)) {
        frame = await Frame.findById(item.productId);
      } else {
        frame = await Frame.findOne({ id: item.productId }); // Fallback for mock seeds
      }
      
      if (!frame) return res.status(404).json({ message: `Product not found: ${item.productId}` });
      if (frame.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${frame.name}` });

      const price = frame.price;
      const total = price * item.quantity;
      subtotal += total;

      validatedItems.push({
        productId: frame._id,
        productName: frame.name,
        productNumber: frame.id,
        quantity: item.quantity,
        price: price,
        total: total,
        frameInstance: frame
      });
    }

    // 2. Atomically deduct stock
    for (const vItem of validatedItems) {
      const frame = vItem.frameInstance;
      const updated = await Frame.findOneAndUpdate(
        { _id: frame._id, stock: { $gte: vItem.quantity } },
        { $inc: { stock: -vItem.quantity } },
        { new: true }
      );
      if (!updated) {
        return res.status(400).json({ message: `Race condition: ${frame.name} went out of stock.` });
      }
      
      if (updated.stock <= 0) updated.status = 'INACTIVE';
      else if (updated.stock <= (updated.lowStockThreshold || 5)) updated.status = 'LOW_STOCK';
      await updated.save();
    }

    const shipping = subtotal > 2000 ? 0 : 150;
    const discount = subtotal > 0 ? Math.round(subtotal * 0.2) : 0; // matching frontend "Welcome saving"
    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.round(taxable * 0.18); // 18% tax
    const totalAmount = taxable + tax + shipping;

    const orderNumber = `NYN-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = new Order({
      orderNumber,
      customer: req.user._id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerMobile: req.user.mobile,
      items: validatedItems,
      subtotal,
      discount,
      tax,
      shipping,
      totalAmount,
      shippingAddress,
      billingAddress,
      notes,
      orderStatus: 'PROCESSING',
      paymentStatus: 'PAID', // auto paid for prototype
      timeline: [{ status: 'PROCESSING', changedBy: req.user._id }]
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Failed to create order', error: error.message });
  }
});

// @route   PATCH /api/orders/:id/status
// @desc    Update order status
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Check permission
    if (req.user.role === 'CUSTOMER') {
      return res.status(403).json({ message: 'Customers cannot update order status' });
    }
    
    const isReturn = status.startsWith('RETURN_') || status.startsWith('REFUND_');
    const reqPerm = isReturn ? 'orders.process_return' : 'orders.update_status';
    
    if (req.user.role === 'STAFF' && (!req.user.permissions || !req.user.permissions.includes(reqPerm))) {
      return res.status(403).json({ message: `Forbidden: Missing ${reqPerm} permission` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Validate transition (simple version for prototype)
    const validTransitions = {
      'PENDING': ['PROCESSING', 'CANCELLED'],
      'PROCESSING': ['PACKED', 'CANCELLED'],
      'PACKED': ['READY_FOR_PICKUP', 'SHIPPED'],
      'READY_FOR_PICKUP': ['DELIVERED'],
      'SHIPPED': ['DELIVERED', 'RETURN_REQUESTED'],
      'DELIVERED': ['RETURN_REQUESTED'],
      'RETURN_REQUESTED': ['RETURN_APPROVED', 'RETURN_REJECTED'],
      'RETURN_APPROVED': ['RETURN_PICKED_UP'],
      'RETURN_PICKED_UP': ['RETURN_RECEIVED'],
      'RETURN_RECEIVED': ['REFUND_PENDING'],
      'REFUND_PENDING': ['REFUNDED']
    };

    if (req.user.role !== 'ADMIN') {
      const allowedNext = validTransitions[order.orderStatus] || [];
      if (!allowedNext.includes(status)) {
        return res.status(400).json({ message: `Invalid transition from ${order.orderStatus} to ${status}` });
      }
    }

    order.orderStatus = status;
    order.timeline.push({ status, changedBy: req.user._id });
    await order.save();

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating order' });
  }
});

module.exports = router;
