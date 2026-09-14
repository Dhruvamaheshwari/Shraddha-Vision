const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Helper for strong password validation
const isStrongPassword = (password) => {
  const minLength = 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return password.length >= minLength && hasUpper && hasLower && hasNumber && hasSpecial;
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, mobileNumber, role = 'CUSTOMER' } = req.body;

    // Validation
    if (!name || !email || !password || !mobileNumber) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    if (!['CUSTOMER', 'STAFF', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      mobileNumber,
      role,
    });

    await newUser.save();

    // Generate token for auto-login
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered and logged in successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        permissions: [],
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).populate('permissionGroup');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Calculate effective permissions for frontend
    let effectivePermissions = [];
    if (user.role === 'STAFF') {
      const groupPermissions = user.permissionGroup ? user.permissionGroup.permissions : [];
      const individualPermissions = user.permissions || [];
      effectivePermissions = Array.from(new Set([...groupPermissions, ...individualPermissions]));
    }

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        permissions: effectivePermissions,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('permissionGroup');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let effectivePermissions = [];
    if (user.role === 'STAFF') {
      const groupPermissions = user.permissionGroup ? user.permissionGroup.permissions : [];
      const individualPermissions = user.permissions || [];
      effectivePermissions = Array.from(new Set([...groupPermissions, ...individualPermissions]));
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      permissions: effectivePermissions,
      outstandingBalance: user.outstandingBalance || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forgot Password
// In a real app, this would send an email. For now, it returns the token for dev testing.
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    // Always return a generic message to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If an account exists for this email, you will receive password reset instructions.' });
    }

    // Generate reset token (mock logic)
    const resetToken = crypto.randomBytes(32).toString('hex');
    // We would normally hash this and save it to the user record with an expiry.
    // For this prototype, we'll just sign a short-lived JWT.
    const token = jwt.sign(
      { userId: user._id, type: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    console.log(`[Mock Email] Password reset token for ${email}: ${token}`);

    res.json({ 
      message: 'If an account exists for this email, you will receive password reset instructions.',
      // Returning token only for local development/testing without real email
      devResetToken: token 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'reset') {
      return res.status(400).json({ message: 'Invalid token type' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Reset token has expired' });
    }
    res.status(400).json({ message: 'Invalid token or server error' });
  }
});

module.exports = router;
