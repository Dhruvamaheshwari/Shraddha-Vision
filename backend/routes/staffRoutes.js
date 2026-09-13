const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const PermissionGroup = require('../models/PermissionGroup');
const AuditLog = require('../models/AuditLog');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Helper to log audit events
const logAudit = async (adminId, targetUserId, action, details) => {
  try {
    await AuditLog.create({ adminId, targetUserId, action, details });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};

// @route   GET /api/staff
// @desc    Get all staff members
// @access  Admin Only
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const staff = await User.find({ role: 'STAFF' }).select('-password').populate('permissionGroup');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/staff
// @desc    Create a new staff member
// @access  Admin Only
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, mobileNumber, permissionGroup, permissions } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStaff = new User({
      name,
      email,
      password: hashedPassword,
      role: 'STAFF',
      mobileNumber,
      permissionGroup,
      permissions: permissions || [],
    });

    await newStaff.save();
    
    await logAudit(req.user._id, newStaff._id, 'CREATED_STAFF', { email: newStaff.email });

    res.status(201).json({ message: 'Staff member created successfully', staff: newStaff });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/staff/:id/permissions
// @desc    Update staff permissions
// @access  Admin Only
router.put('/:id/permissions', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { permissionGroup, permissions } = req.body;
    
    const staff = await User.findOne({ _id: req.params.id, role: 'STAFF' });
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    staff.permissionGroup = permissionGroup;
    staff.permissions = permissions;
    await staff.save();

    await logAudit(req.user._id, staff._id, 'UPDATED_PERMISSIONS', { permissionGroup, permissions });

    res.json({ message: 'Staff permissions updated successfully', staff });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/staff/:id/status
// @desc    Update staff status (ACTIVE, INACTIVE, SUSPENDED)
// @access  Admin Only
router.put('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const staff = await User.findOne({ _id: req.params.id, role: 'STAFF' });
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const oldStatus = staff.status;
    staff.status = status;
    await staff.save();

    await logAudit(req.user._id, staff._id, 'CHANGED_STATUS', { oldStatus, newStatus: status });

    res.json({ message: 'Staff status updated successfully', staff });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// @route   GET /api/staff/permission-groups
// @desc    Get all permission groups
// @access  Admin Only
router.get('/permission-groups', requireAuth, requireAdmin, async (req, res) => {
  try {
    const groups = await PermissionGroup.find({});
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/staff/permission-groups
// @desc    Create a new permission group
// @access  Admin Only
router.post('/permission-groups', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    const newGroup = new PermissionGroup({ name, description, permissions });
    await newGroup.save();
    
    res.status(201).json({ message: 'Permission group created successfully', group: newGroup });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
