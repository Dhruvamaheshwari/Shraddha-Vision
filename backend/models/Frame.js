const mongoose = require('mongoose');

const frameSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Keeping frontend's 'no-101' format for compatibility
  name: { type: String, required: true },
  code: { type: String, required: true },
  brand: { type: String, required: true },
  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  shape: { type: String, required: true },
  size: { type: String, required: true },
  colors: [{ type: String }],
  stock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  status: { type: String, enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'INACTIVE'], default: 'IN_STOCK' },
  category: { type: String, required: true },
  lens: [{ type: String }],
  tag: { type: String },
  discount: { type: Number, default: 0 },
  description: { type: String, default: '' },
  images: [{
    url: String,
    publicId: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Frame', frameSchema);
