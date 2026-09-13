require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const fs = require('fs');

const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({ cloud_name, api_key, api_secret });

async function testDirectUpload() {
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    folder: 'shraddha-vision/products/test',
    timestamp: timestamp
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, api_secret);

  const FormData = require('form-data');
  const form = new FormData();
  form.append('api_key', api_key);
  form.append('timestamp', timestamp);
  form.append('signature', signature);
  form.append('folder', 'shraddha-vision/products/test');
  
  // dummy 1x1 png base64 encoded
  form.append('file', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');

  try {
    const fetch = (await import('node-fetch')).default; // assuming node-fetch is available, or use axios
  } catch(e) {}
  
  const https = require('https');
  const req = https.request({
    hostname: 'api.cloudinary.com',
    path: `/v1_1/${cloud_name}/image/upload`,
    method: 'POST',
    headers: form.getHeaders()
  }, (res) => {
    console.log('HTTP Status:', res.statusCode);
    console.log('X-Cld-Error:', res.headers['x-cld-error']);
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Body:', data);
    });
  });

  req.on('error', (e) => {
    console.error('Request Error:', e);
  });

  form.pipe(req);
}

testDirectUpload();
