const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  type: { type: String, enum: ['PURCHASE', 'PAYMENT', 'REFUND', 'ADJUSTMENT', 'CREDIT'], required: true },
  amount: { type: Number, required: true },
  orderTotal: { type: Number },
  amountPaid: { type: Number },
  outstandingAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other'] },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
