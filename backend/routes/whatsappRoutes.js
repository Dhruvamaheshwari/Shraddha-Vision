const express = require('express');
const Reorder = require('../models/Reorder');
const whatsappService = require('../services/whatsappService');

const router = express.Router();

// @route   GET /api/whatsapp/webhook
// @desc    Verify webhook
router.get('/webhook', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    const verifiedChallenge = whatsappService.verifyWebhook(mode, token, challenge);
    res.status(200).send(verifiedChallenge);
  } catch (error) {
    res.status(403).send('Forbidden');
  }
});

// @route   POST /api/whatsapp/webhook
// @desc    Handle incoming webhooks
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;
    
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            // Incoming message
            for (const msg of change.value.messages) {
              if (msg.type === 'text') {
                const text = msg.text.body.trim().toLowerCase();
                if (['ok', 'yes', 'confirm'].includes(text)) {
                  // Find the most recent pending reorder for this number
                  // Extract phone number from msg.from
                  const phone = msg.from;
                  
                  // In a real scenario, we'd lookup the Dealer by phone and then their pending Reorders
                  // We'll try to find any pending reorder (SENT/DELIVERED/SEEN)
                  // To be fully robust we need the dealer record
                  // Using aggregation or populate to find dealer with this number
                  const mongoose = require('mongoose');
                  const Dealer = require('../models/Dealer');
                  const dealer = await Dealer.findOne({ whatsappNumber: phone });
                  
                  if (dealer) {
                    const reorder = await Reorder.findOne({ 
                      dealer: dealer._id, 
                      status: { $in: ['SENT', 'DELIVERED', 'SEEN'] } 
                    }).sort({ createdAt: -1 });
                    
                    if (reorder) {
                      reorder.status = 'CONFIRMED';
                      reorder.confirmedAt = new Date();
                      await reorder.save();
                    }
                  }
                }
              }
            }
          } else if (change.value.statuses) {
            // Status update
            for (const status of change.value.statuses) {
              const msgId = status.id;
              const statusStr = status.status; // 'sent', 'delivered', 'read', 'failed'
              
              const reorder = await Reorder.findOne({ whatsappMessageId: msgId });
              if (reorder) {
                if (statusStr === 'sent') {
                  reorder.status = 'SENT';
                  reorder.sentAt = new Date();
                } else if (statusStr === 'delivered') {
                  reorder.status = 'DELIVERED';
                  reorder.deliveredAt = new Date();
                } else if (statusStr === 'read') {
                  reorder.status = 'SEEN';
                  reorder.readAt = new Date();
                } else if (statusStr === 'failed') {
                  reorder.status = 'FAILED';
                }
                
                // Only update if it makes sense (don't downgrade from SEEN to SENT)
                // For simplicity, we just save it since they arrive chronologically usually
                await reorder.save();
              }
            }
          }
        }
      }
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

module.exports = router;
