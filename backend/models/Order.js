const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  productNumber: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true }
});

const statusEventSchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: { type: String }, // denormalized for easy searching
  customerEmail: { type: String },
  customerMobile: { type: String },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], default: 'PENDING' },
  orderStatus: { 
    type: String, 
    enum: ['PENDING', 'PROCESSING', 'PACKED', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_REJECTED', 'RETURN_PICKED_UP', 'RETURN_RECEIVED', 'REFUND_PENDING', 'REFUNDED'], 
    default: 'PENDING' 
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  notes: { type: String },
  timeline: [statusEventSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
