const mongoose = require('mongoose');

const eyeDataSchema = new mongoose.Schema({
  sph: String,
  cyl: String,
  axis: String,
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  od: eyeDataSchema,
  os: eyeDataSchema,
  pd: String,
  add: String,
  notes: String,
  date: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
