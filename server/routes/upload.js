const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const hash = crypto.randomBytes(16).toString('hex');
    cb(null, `${hash}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('只支持图片文件'));
  }
});

router.post('/', authMiddleware, adminMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: '请选择图片' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: '文件大小不能超过5MB' });
  if (err.message) return res.status(400).json({ message: err.message });
  next(err);
});

module.exports = router;
