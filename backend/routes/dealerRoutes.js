const express = require('express');
const Dealer = require('../models/Dealer');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/dealers
// @desc    Get all active dealers
router.get('/', requireAuth, async (req, res) => {
  try {
    const dealers = await Dealer.find({ active: true });
    res.json(dealers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/dealers
// @desc    Add a new dealer
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, whatsappNumber, companyName, address } = req.body;
    const dealer = new Dealer({ name, whatsappNumber, companyName, address });
    await dealer.save();
    res.status(201).json(dealer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/dealers/:id
// @desc    Update a dealer
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, whatsappNumber, companyName, address, active } = req.body;
    const dealer = await Dealer.findById(req.params.id);
    if (!dealer) return res.status(404).json({ message: 'Dealer not found' });
    
    if (name) dealer.name = name;
    if (whatsappNumber) dealer.whatsappNumber = whatsappNumber;
    if (companyName) dealer.companyName = companyName;
    if (address !== undefined) dealer.address = address;
    if (active !== undefined) dealer.active = active;
    
    await dealer.save();
    res.json(dealer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
