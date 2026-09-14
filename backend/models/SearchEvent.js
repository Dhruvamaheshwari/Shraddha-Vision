const mongoose = require('mongoose');

const searchEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  searchType: {
    type: String,
    enum: ['TEXT', 'IMAGE'],
    required: true
  },
  query: {
    type: String,
    default: ''
  },
  normalizedQuery: {
    type: String,
    default: '',
    index: true
  },
  filters: {
    shape: String,
    brand: String,
    lens: String,
    budgetLabel: String
  },
  resultCount: {
    type: Number,
    default: 0
  },
  resultProductIds: [{
    type: String // In frontend it's string IDs
  }],
  selectedProduct: {
    type: String,
    default: null
  },
  addedToCart: {
    type: Boolean,
    default: false
  },
  convertedToPurchase: {
    type: Boolean,
    default: false,
    index: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  }
}, { timestamps: true });

// Basic indexes to speed up aggregations
searchEventSchema.index({ createdAt: -1 });
searchEventSchema.index({ searchType: 1 });
searchEventSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model('SearchEvent', searchEventSchema);
