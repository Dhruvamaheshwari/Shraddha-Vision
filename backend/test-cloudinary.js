require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testUpload() {
  try {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'shraddha-vision/products/test' },
      (error, result) => {
        if (error) {
          console.error('CLOUDINARY_ERROR_START');
          console.error(JSON.stringify(error, null, 2));
          console.error('CLOUDINARY_ERROR_END');
          if (error.http_code) {
             console.log('HTTP Status:', error.http_code);
          }
        } else {
          console.log('Upload successful:', result.public_id);
        }
      }
    );
    
    // Write a dummy 1x1 transparent PNG
    const dummyImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    uploadStream.end(dummyImage);
  } catch (e) {
    console.error('Exception:', e);
  }
}

testUpload();
