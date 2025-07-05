
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists with proper error handling
const uploadDir = 'uploads/faces/';
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created faces upload directory:', uploadDir);
  }
} catch (error) {
  console.error('Failed to create faces upload directory:', error);
}

const upload = multer({ dest: uploadDir });

module.exports = upload;
