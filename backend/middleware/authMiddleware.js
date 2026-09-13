const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user and populate permissionGroup to calculate effective permissions
      req.user = await User.findById(decoded.userId)
        .select('-password')
        .populate('permissionGroup');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      if (req.user.status !== 'ACTIVE') {
        return res.status(403).json({ message: 'Account is not active' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (req.user.role === 'ADMIN') {
      return next(); // Admin has full access
    }

    if (req.user.role === 'STAFF') {
      // Calculate effective permissions
      const groupPermissions = req.user.permissionGroup ? req.user.permissionGroup.permissions : [];
      const individualPermissions = req.user.permissions || [];
      
      const effectivePermissions = new Set([...groupPermissions, ...individualPermissions]);

      if (effectivePermissions.has(requiredPermission)) {
        return next();
      }
    }

    return res.status(403).json({ message: `Forbidden: Requires permission '${requiredPermission}'` });
  };
};

module.exports = { requireAuth, requireAdmin, requirePermission };
