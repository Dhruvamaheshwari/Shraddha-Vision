const mongoose = require('mongoose');

const reorderSchema = new mongoose.Schema({
  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: true,
  },
  lens: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LensInventory',
    required: true,
  },
  variant: String,
  quantity: {
    type: Number,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  whatsappMessageId: String,
  status: {
    type: String,
    enum: ['DRAFT', 'SENT', 'DELIVERED', 'SEEN', 'CONFIRMED', 'CANCELLED', 'FAILED', 'RECEIVED'],
    default: 'DRAFT',
  },
  receivedQuantity: {
    type: Number,
    default: 0,
  },
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date,
  confirmedAt: Date,
  receivedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Reorder', reorderSchema);
