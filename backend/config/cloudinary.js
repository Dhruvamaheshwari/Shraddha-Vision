const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name,
  api_key,
  api_secret
});

// Safe startup diagnostic
if (cloud_name && api_key) {
  const maskedKey = api_key.length > 4 ? `***${api_key.slice(-4)}` : '***';
  console.log(`✅ Cloudinary Configured | Cloud: ${cloud_name} | Key: ${maskedKey}`);
} else {
  console.warn('⚠️ Cloudinary configuration is missing in .env');
}

module.exports = cloudinary;
