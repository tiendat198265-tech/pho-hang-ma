const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [
    '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.jfif', '.bmp', '.avif',
    '.mp4', '.webm', '.mov', '.ogg'
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  const isMediaMime =
    file.mimetype &&
    (file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/') ||
      file.mimetype === 'application/octet-stream');

  if (isMediaMime && (allowedExtensions.includes(ext) || ext === '')) {
    cb(null, true);
  } else if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh hoặc video định dạng JPEG, PNG, WEBP, GIF, SVG, MP4, WEBM, MOV'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 60 * 1024 * 1024, // 60MB for videos and images
    files: 10,
  },
  fileFilter: fileFilter,
});

module.exports = upload;
