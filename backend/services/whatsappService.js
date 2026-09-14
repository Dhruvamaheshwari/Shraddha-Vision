const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || 'dummy_token';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || 'dummy_phone_id';
    this.apiUrl = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`;
  }

  async sendTextMessage(to, text) {
    try {
      console.log(`[WhatsAppService] Sending message to ${to}: ${text}`);
      
      // If we don't have real credentials, just mock the success
      if (this.accessToken === 'dummy_token') {
        console.log('[WhatsAppService] Using dummy credentials. Mocking success.');
        return {
          messages: [{ id: `mock_wamid_${Date.now()}` }]
        };
      }

      const response = await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: text
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('[WhatsAppService] Error sending message:', error.response?.data || error.message);
      throw error;
    }
  }

  verifyWebhook(mode, token, challenge) {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'nayan_verify_token';
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    throw new Error('Invalid token');
  }
}

module.exports = new WhatsAppService();
