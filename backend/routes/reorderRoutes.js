const express = require('express');
const Reorder = require('../models/Reorder');
const LensInventory = require('../models/LensInventory');
const whatsappService = require('../services/whatsappService');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/reorders
// @desc    Get reorder history
router.get('/', requireAuth, async (req, res) => {
  try {
    const reorders = await Reorder.find().populate('dealer').populate('lens').sort({ createdAt: -1 });
    res.json(reorders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reorders
// @desc    Create a new reorder and send WhatsApp message
router.post('/', requireAuth, async (req, res) => {
  try {
    const { dealerId, lensId, variant, quantity, message } = req.body;
    
    // Create Reorder record
    const reorder = new Reorder({
      dealer: dealerId,
      lens: lensId,
      variant,
      quantity,
      message,
      createdBy: req.user._id,
      status: 'SENT',
      sentAt: new Date()
    });

    await reorder.save();

    // Populate dealer to get WhatsApp number
    await reorder.populate('dealer');

    // Send WhatsApp message
    try {
      const response = await whatsappService.sendTextMessage(reorder.dealer.whatsappNumber, message);
      reorder.whatsappMessageId = response.messages?.[0]?.id;
      await reorder.save();
    } catch (waError) {
      console.error('WhatsApp send failed:', waError);
      reorder.status = 'FAILED';
      await reorder.save();
      return res.status(500).json({ message: 'Failed to send WhatsApp message, but reorder was saved', reorder });
    }

    res.status(201).json(reorder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reorders/:id/receive
// @desc    Receive stock for a confirmed reorder
router.post('/:id/receive', requireAuth, async (req, res) => {
  try {
    const { receivedQuantity, notes } = req.body;
    
    const reorder = await Reorder.findById(req.params.id);
    if (!reorder) return res.status(404).json({ message: 'Reorder not found' });
    
    if (reorder.status === 'RECEIVED') {
      return res.status(400).json({ message: 'Reorder is already received' });
    }

    reorder.status = 'RECEIVED';
    reorder.receivedQuantity = receivedQuantity;
    reorder.receivedAt = new Date();
    await reorder.save();

    // Increment inventory
    const lens = await LensInventory.findById(reorder.lens);
    if (lens) {
      lens.currentStock += Number(receivedQuantity);
      lens.history.push({
        type: 'RECEIVE',
        quantity: Number(receivedQuantity),
        notes: notes || 'Received from reorder',
        reorderId: reorder._id
      });
      await lens.save();
    }

    res.json(reorder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
