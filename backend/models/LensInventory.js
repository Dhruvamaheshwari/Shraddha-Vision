const mongoose = require('mongoose');

const lensInventorySchema = new mongoose.Schema({
  material: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    required: true,
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0,
  },
  threshold: {
    type: Number,
    required: true,
    default: 10,
  },
  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer'
  },
  lastAcknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastAcknowledgedAt: {
    type: Date,
  },
  history: [{
    type: { type: String, enum: ['ADD', 'REMOVE', 'RECEIVE'] },
    quantity: Number,
    date: { type: Date, default: Date.now },
    notes: String,
    reorderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reorder' }
  }]
}, {
  timestamps: true,
});

module.exports = mongoose.model('LensInventory', lensInventorySchema);
