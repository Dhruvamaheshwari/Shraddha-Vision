const express = require('express');
const LensInventory = require('../models/LensInventory');
const { requireAuth } = require('../middleware/authMiddleware');
const { generateCSV } = require('../utils/csvExport');

const router = express.Router();

// @route   GET /api/inventory/lenses
// @desc    Get all lens inventory
router.get('/', requireAuth, async (req, res) => {
  try {
    const lenses = await LensInventory.find().populate('dealer').populate('lastAcknowledgedBy', 'name');
    res.json(lenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/inventory/lenses
// @desc    Add new lens to inventory
router.post('/', requireAuth, async (req, res) => {
  try {
    const { material, variant, currentStock, threshold, dealer } = req.body;
    const lens = new LensInventory({ material, variant, currentStock, threshold, dealer });
    await lens.save();
    res.status(201).json(lens);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/inventory/lenses/:id/acknowledge
// @desc    Acknowledge low stock alert
router.post('/:id/acknowledge', requireAuth, async (req, res) => {
  try {
    const lens = await LensInventory.findById(req.params.id);
    if (!lens) return res.status(404).json({ message: 'Lens not found' });

    lens.lastAcknowledgedAt = new Date();
    lens.lastAcknowledgedBy = req.user._id;
    await lens.save();

    res.json(lens);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/inventory/lenses/export
// @desc    Export lens inventory to CSV
router.get('/export', requireAuth, async (req, res) => {
  // Require inventory.view permission
  if (req.user.role === 'STAFF' && (!req.user.permissions || !req.user.permissions.includes('inventory.view'))) {
    return res.status(403).json({ message: 'Forbidden: Missing inventory.view permission' });
  }
  if (req.user.role === 'CUSTOMER') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const lenses = await LensInventory.find().populate('dealer');
    
    const headers = ['Lens/Material', 'Variant', 'On Hand', 'Threshold', 'Health', 'Dealer', 'Last Updated'];
    
    const rows = lenses.map(l => {
      const health = l.currentStock <= l.threshold ? 'Low Stock' : 'Healthy';
      const dealerName = l.dealer ? l.dealer.name : 'Unknown';
      return [
        l.material,
        l.variant,
        l.currentStock,
        l.threshold,
        health,
        dealerName,
        new Date(l.updatedAt).toISOString()
      ];
    });

    const csvData = generateCSV(headers, rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('lens_inventory.csv');
    return res.send(csvData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error exporting lenses' });
  }
});

module.exports = router;
