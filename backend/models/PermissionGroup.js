const mongoose = require('mongoose');

const permissionGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

const PermissionGroup = mongoose.model('PermissionGroup', permissionGroupSchema);
module.exports = PermissionGroup;
