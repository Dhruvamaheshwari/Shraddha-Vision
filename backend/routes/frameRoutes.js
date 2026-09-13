const express = require('express');
const Frame = require('../models/Frame');
const { requireAuth, requirePermission } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/frames
// @desc    Get all frames (Public)
router.get('/', async (req, res) => {
  try {
    const frames = await Frame.find({});
    // Map _id to id if frontend needs it, though we stored 'id' explicitly
    res.json(frames);
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
    const newFrame = new Frame(req.body);
    const savedFrame = await newFrame.save();
    res.status(201).json(savedFrame);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Failed to create frame', error: error.message });
  }
});

// @route   PATCH /api/frames/:id
// @desc    Update a frame (Protected: require frames.edit)
router.patch('/:id', requireAuth, requirePermission('frames.edit'), async (req, res) => {
  try {
    const frame = await Frame.findOneAndUpdate({ id: req.params.id }, req.body, { new: true, runValidators: true });
    if (!frame) return res.status(404).json({ message: 'Frame not found' });
    res.json(frame);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Failed to update frame', error: error.message });
  }
});

// @route   DELETE /api/frames/:id
// @desc    Delete a frame (Protected: require frames.delete)
router.delete('/:id', requireAuth, requirePermission('frames.delete'), async (req, res) => {
  try {
    const frame = await Frame.findOneAndDelete({ id: req.params.id });
    if (!frame) return res.status(404).json({ message: 'Frame not found' });
    res.json({ message: 'Frame deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting frame' });
  }
});

module.exports = router;
