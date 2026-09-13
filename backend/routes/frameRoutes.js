const express = require('express');
const Frame = require('../models/Frame');
const { requireAuth, requirePermission } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/frames
// @desc    Get all frames with pagination, search, category
// @access  Public (customer uses this too, but maybe filters out INACTIVE)
router.get('/', async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20, includeInactive = false } = req.query;
    
    let query = {};
    if (!includeInactive || includeInactive === 'false') {
      query.status = { $ne: 'INACTIVE' };
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { brand: searchRegex },
        { colors: searchRegex },
        { shape: searchRegex }
      ];
    }

    if (category && category !== 'All categories') {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Frame.countDocuments(query);
    const frames = await Frame.find(query).skip(skip).limit(parseInt(limit));

    res.json({
      frames,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching frames' });
  }
});

// @route   GET /api/frames/:id
// @desc    Get a single frame by string id (Public)
router.get('/:id', async (req, res) => {
  try {
    const frame = await Frame.findOne({ id: req.params.id });
    if (!frame) return res.status(404).json({ message: 'Frame not found' });
    res.json(frame);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching frame' });
  }
});

// @route   POST /api/frames
// @desc    Create a new frame (Protected: require frames.create)
router.post('/', requireAuth, requirePermission('frames.create'), async (req, res) => {
  try {
    if (req.body.price < 0) return res.status(400).json({ message: 'Price cannot be negative' });
    if (req.body.stock < 0) return res.status(400).json({ message: 'Stock cannot be negative' });

    let status = 'IN_STOCK';
    const stock = Number(req.body.stock) || 0;
    const thresh = Number(req.body.lowStockThreshold) || 10;
    if (stock === 0) status = 'OUT_OF_STOCK';
    else if (stock <= thresh) status = 'LOW_STOCK';

    const newFrame = new Frame({ ...req.body, status });
    const savedFrame = await newFrame.save();
    res.status(201).json(savedFrame);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A product with this product code already exists.' });
    }
    console.error(error);
    res.status(400).json({ message: 'Failed to create frame', error: error.message });
  }
});

// @route   PATCH /api/frames/:id
// @desc    Update a frame (Protected: require frames.edit)
router.patch('/:id', requireAuth, requirePermission('frames.edit'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    // Auto calculate status if stock changes
    if ('stock' in updateData || 'lowStockThreshold' in updateData || 'status' in updateData) {
      if (updateData.status !== 'INACTIVE') {
        const frame = await Frame.findOne({ id: req.params.id });
        if (frame) {
          const stock = 'stock' in updateData ? Number(updateData.stock) : frame.stock;
          const thresh = 'lowStockThreshold' in updateData ? Number(updateData.lowStockThreshold) : frame.lowStockThreshold;
          if (stock === 0) updateData.status = 'OUT_OF_STOCK';
          else if (stock <= thresh) updateData.status = 'LOW_STOCK';
          else updateData.status = 'IN_STOCK';
        }
      }
    }

    const frame = await Frame.findOneAndUpdate({ id: req.params.id }, updateData, { new: true, runValidators: true });
    if (!frame) return res.status(404).json({ message: 'Frame not found' });
    res.json(frame);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Failed to update frame', error: error.message });
  }
});

// @route   DELETE /api/frames/:id
// @desc    Soft Delete a frame (Protected: require frames.delete)
router.delete('/:id', requireAuth, requirePermission('frames.delete'), async (req, res) => {
  try {
    const frame = await Frame.findOneAndUpdate({ id: req.params.id }, { status: 'INACTIVE' }, { new: true });
    if (!frame) return res.status(404).json({ message: 'Frame not found' });
    res.json({ message: 'Frame marked as inactive', frame });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting frame' });
  }
});

module.exports = router;
