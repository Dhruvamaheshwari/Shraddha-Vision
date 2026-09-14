const express = require('express');
const mongoose = require('mongoose');
const SearchEvent = require('../models/SearchEvent');
const Order = require('../models/Order');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Rate limiting for public search events: simple memory limit for anon
const ipRateLimit = new Map();

// Helper to normalize query
const normalize = (q) => q ? q.toLowerCase().trim().replace(/\s+/g, ' ') : '';

// @route   POST /api/analytics/search-event
// @desc    Track a new search event
router.post('/search-event', async (req, res) => {
  try {
    const { sessionId, searchType, query, filters, resultCount, resultProductIds } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    if (!['TEXT', 'IMAGE'].includes(searchType)) {
      return res.status(400).json({ message: 'Invalid searchType' });
    }
    
    // IP Rate limiting
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxHits = 30; // Max 30 searches per minute per IP
    
    if (ipRateLimit.has(ip)) {
      const data = ipRateLimit.get(ip);
      if (now - data.start < windowMs) {
        if (data.count > maxHits) {
          return res.status(429).json({ message: 'Too many requests' });
        }
        data.count++;
      } else {
        ipRateLimit.set(ip, { count: 1, start: now });
      }
    } else {
      ipRateLimit.set(ip, { count: 1, start: now });
    }
    
    // Optional Auth (for registered users)
    let user = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      // In a real app we'd decode token here if not using full auth middleware
      // We can also let the frontend pass the decoded user._id safely if we verify it,
      // but it's safer to just let the order attribution handle it via sessionId or implement full token decode here.
      // Since this is a public route, we will just use the token if valid.
      const jwt = require('jsonwebtoken');
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_for_dev_only');
        user = decoded.id;
      } catch (e) {
        // Ignore invalid token on public route
      }
    }

    const normalizedQuery = normalize(query);
    if (normalizedQuery.length > 200) {
      return res.status(400).json({ message: 'Query too long' });
    }

    const searchEvent = new SearchEvent({
      user,
      sessionId,
      searchType,
      query: query || '',
      normalizedQuery,
      filters: filters || {},
      resultCount: resultCount || 0,
      resultProductIds: resultProductIds || []
    });

    await searchEvent.save();
    res.status(201).json({ id: searchEvent._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/analytics/search-event/:id/interact
// @desc    Update a search event when user clicks or adds to cart
router.patch('/search-event/:id/interact', async (req, res) => {
  try {
    const { selectedProduct, addedToCart } = req.body;
    const event = await SearchEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    // Simple ownership check: if session ID matches
    const clientSessionId = req.headers['x-session-id'] || req.body.sessionId;
    if (clientSessionId && event.sessionId !== clientSessionId) {
      return res.status(403).json({ message: 'Not authorized for this session' });
    }

    if (selectedProduct) event.selectedProduct = selectedProduct;
    if (addedToCart) event.addedToCart = true;

    await event.save();
    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/search
// @desc    Get aggregated search analytics (Admin only)
router.get('/search', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { range } = req.query; // e.g. 7d, 30d, 90d
    let days = 7;
    if (range === '30 days') days = 30;
    if (range === '90 days') days = 90;
    
    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - days * 24 * 60 * 60 * 1000);

    const getMetrics = async (startDate, endDate) => {
      const matchStage = { createdAt: { $gte: startDate, $lt: endDate } };
      
      const [metrics] = await SearchEvent.aggregate([
        { $match: matchStage },
        { 
          $group: {
            _id: null,
            searches: { $sum: 1 },
            imageSearches: { 
              $sum: { $cond: [{ $eq: ["$searchType", "IMAGE"] }, 1, 0] } 
            },
            zeroResultSearches: { 
              $sum: { $cond: [{ $eq: ["$resultCount", 0] }, 1, 0] } 
            },
            convertedSessions: {
              $addToSet: { $cond: [{ $eq: ["$convertedToPurchase", true] }, "$sessionId", null] }
            },
            totalSessions: {
              $addToSet: "$sessionId"
            }
          }
        }
      ]);

      if (!metrics) {
        return { searches: 0, imageSearches: 0, zeroResultSearches: 0, searchToPurchase: 0 };
      }

      // Calculate Session-based Conversion Rate
      // unique sessions that bought / unique sessions that searched
      const totalS = metrics.totalSessions.filter(x => x).length;
      const convertedS = metrics.convertedSessions.filter(x => x).length;
      const searchToPurchase = totalS > 0 ? (convertedS / totalS) * 100 : 0;

      return {
        searches: metrics.searches,
        imageSearches: metrics.imageSearches,
        zeroResultSearches: metrics.zeroResultSearches,
        searchToPurchase
      };
    };

    const currentMetrics = await getMetrics(currentPeriodStart, now);
    const previousMetrics = await getMetrics(previousPeriodStart, currentPeriodStart);

    // Top Keywords (Current period only, non-empty, Text search only)
    const topKeywords = await SearchEvent.aggregate([
      { $match: { createdAt: { $gte: currentPeriodStart }, searchType: 'TEXT', normalizedQuery: { $ne: '' } } },
      { $group: { _id: "$normalizedQuery", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, keyword: "$_id", count: 1 } }
    ]);

    // Intent Signals (Current period only)
    const getTopIntent = async (field) => {
      const res = await SearchEvent.aggregate([
        { $match: { createdAt: { $gte: currentPeriodStart }, [`filters.${field}`]: { $exists: true, $ne: '' } } },
        { $group: { _id: `$filters.${field}`, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]);
      if (res.length > 0 && currentMetrics.searches > 0) {
        return { value: res[0]._id, percentage: Math.round((res[0].count / currentMetrics.searches) * 100) };
      }
      return { value: 'None', percentage: 0 };
    };

    const intentSignals = {
      shape: await getTopIntent('shape'),
      budget: await getTopIntent('budgetLabel'),
      brand: await getTopIntent('brand'),
      lens: await getTopIntent('lens')
    };

    res.json({
      summary: currentMetrics,
      comparison: previousMetrics,
      topKeywords,
      intentSignals
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
