const mongoose = require('mongoose');

const dealerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  whatsappNumber: {
    type: String,
    required: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  address: String,
  active: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Dealer', dealerSchema);
