const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Frame = require('../models/Frame');
const { requireAuth, requirePermission } = require('../middleware/authMiddleware');
const { generateCSV } = require('../utils/csvExport');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP are allowed.'), false);
    }
  }
});

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

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

// @route   GET /api/frames/export
// @desc    Export frames to CSV
// @access  Protected (products.view)
router.get('/export', requireAuth, requirePermission('products.view'), async (req, res) => {
  try {
    const { search, category, includeInactive = false } = req.query;
    
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

    const frames = await Frame.find(query).sort({ createdAt: -1 });

    const headers = ['Product ID', 'Product Code', 'Name', 'Brand', 'Category', 'Price', 'Stock', 'Threshold', 'Status', 'Shape', 'Lens Type', 'Color', 'Created At'];
    
    const rows = frames.map(f => [
      f._id,
      f.code,
      f.name,
      f.brand,
      f.category,
      f.price,
      f.stock,
      f.lowStockThreshold,
      f.status,
      f.shape,
      (f.lens || []).join('; '),
      (f.colors || []).join('; '),
      new Date(f.createdAt).toISOString()
    ]);

    const csvData = generateCSV(headers, rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('products.csv');
    return res.send(csvData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error exporting frames' });
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
router.post('/', requireAuth, requirePermission('frames.create'), upload.array('images', 5), async (req, res) => {
  const uploadedAssets = [];
  try {
    const price = Number(req.body.price);
    const stockNum = Number(req.body.stock) || 0;
    
    if (price < 0) return res.status(400).json({ message: 'Price cannot be negative' });
    if (stockNum < 0) return res.status(400).json({ message: 'Stock cannot be negative' });

    const code = (req.body.code || '').toLowerCase();
    
    // Process images
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, `shraddha-vision/products/${code}`);
        uploadedAssets.push(result.public_id);
        images.push({ url: result.secure_url, publicId: result.public_id });
      }
    }

    let status = 'IN_STOCK';
    const stock = Number(req.body.stock) || 0;
    const thresh = Number(req.body.lowStockThreshold) || 10;
    if (stock === 0) status = 'OUT_OF_STOCK';
    else if (stock <= thresh) status = 'LOW_STOCK';

    // Parse array fields that were sent as JSON strings or comma-separated from FormData
    const colors = req.body.colors ? (Array.isArray(req.body.colors) ? req.body.colors : typeof req.body.colors === 'string' ? req.body.colors.split(',') : []) : [];
    const lens = req.body.lens ? (Array.isArray(req.body.lens) ? req.body.lens : typeof req.body.lens === 'string' ? req.body.lens.split(',') : []) : [];

    const newFrame = new Frame({ 
      ...req.body, 
      id: code, // Add id explicitly
      price, 
      stock: stockNum, 
      colors, 
      lens, 
      status, 
      images 
    });
    const savedFrame = await newFrame.save();
    res.status(201).json(savedFrame);
  } catch (error) {
    // Cleanup if MongoDB save fails
    for (const publicId of uploadedAssets) {
      await cloudinary.uploader.destroy(publicId).catch(console.error);
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A product with this product code already exists.' });
    }
    console.error(error);
    res.status(400).json({ message: 'Failed to create frame', error: error.stack || error.message || error.toString() });
  }
});

// @route   PATCH /api/frames/:id
// @desc    Update a frame (Protected: require frames.edit)
router.patch('/:id', requireAuth, requirePermission('frames.edit'), upload.array('images', 5), async (req, res) => {
  const newlyUploadedAssets = [];
  try {
    const frame = await Frame.findOne({ id: req.params.id });
    if (!frame) return res.status(404).json({ message: 'Frame not found' });

    const updateData = { ...req.body };
    
    if ('price' in updateData) updateData.price = Number(updateData.price);
    if ('mrp' in updateData) updateData.mrp = Number(updateData.mrp);
    if ('stock' in updateData) updateData.stock = Number(updateData.stock);
    if ('lowStockThreshold' in updateData) updateData.lowStockThreshold = Number(updateData.lowStockThreshold);

    // Parse array fields that were sent as JSON strings or comma-separated from FormData
    if (updateData.colors) updateData.colors = Array.isArray(updateData.colors) ? updateData.colors : typeof updateData.colors === 'string' ? updateData.colors.split(',') : [];
    if (updateData.lens) updateData.lens = Array.isArray(updateData.lens) ? updateData.lens : typeof updateData.lens === 'string' ? updateData.lens.split(',') : [];

    let currentImages = [...(frame.images || [])];
    const imagesToRemove = updateData.imagesToRemove ? JSON.parse(updateData.imagesToRemove) : [];
    delete updateData.imagesToRemove;
    
    // Filter out valid removals
    const validRemovals = imagesToRemove.filter(pid => currentImages.some(img => img.publicId === pid));
    currentImages = currentImages.filter(img => !validRemovals.includes(img.publicId));

    if (req.files && req.files.length > 0) {
      if (currentImages.length + req.files.length > 5) {
        return res.status(400).json({ message: 'Maximum 5 images allowed per product' });
      }
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, `shraddha-vision/products/${frame.code}`);
        newlyUploadedAssets.push(result.public_id);
        currentImages.push({ url: result.secure_url, publicId: result.public_id });
      }
    }

    updateData.images = currentImages;

    // Auto calculate status if stock changes
    if ('stock' in updateData || 'lowStockThreshold' in updateData || 'status' in updateData) {
      if (updateData.status !== 'INACTIVE') {
        const stock = 'stock' in updateData ? Number(updateData.stock) : frame.stock;
        const thresh = 'lowStockThreshold' in updateData ? Number(updateData.lowStockThreshold) : frame.lowStockThreshold;
        if (stock === 0) updateData.status = 'OUT_OF_STOCK';
        else if (stock <= thresh) updateData.status = 'LOW_STOCK';
        else updateData.status = 'IN_STOCK';
      }
    }

    const updatedFrame = await Frame.findOneAndUpdate({ id: req.params.id }, updateData, { new: true, runValidators: true });
    
    // Cleanup valid removals only after DB update succeeds
    for (const pid of validRemovals) {
      await cloudinary.uploader.destroy(pid).catch(console.error);
    }
    
    res.json(updatedFrame);
  } catch (error) {
    // Cleanup newly uploaded assets if anything fails before DB update
    for (const publicId of newlyUploadedAssets) {
      await cloudinary.uploader.destroy(publicId).catch(console.error);
    }
    console.error(error);
    res.status(400).json({ message: 'Failed to update frame', error: error.stack || error.message || error.toString() });
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
