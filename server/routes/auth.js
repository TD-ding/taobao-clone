const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const getDb = require('../db');
const { authMiddleware, SECRET } = require('../middleware/auth');

const router = express.Router();

const registerLimiter = new Map();
const REGISTER_WINDOW = 60 * 1000;
const REGISTER_MAX = 3;
const CLEANUP_INTERVAL = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of registerLimiter) {
    if (now - record.start > REGISTER_WINDOW) registerLimiter.delete(ip);
  }
}, CLEANUP_INTERVAL);

function checkRegisterLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const record = registerLimiter.get(ip) || { count: 0, start: now };

  if (now - record.start > REGISTER_WINDOW) {
    record.count = 0;
    record.start = now;
  }

  record.count++;
  registerLimiter.set(ip, record);

  if (record.count > REGISTER_MAX) {
    return res.status(429).json({ message: '注册请求过于频繁，请稍后再试' });
  }
  next();
}

router.post('/register', checkRegisterLimit, (req, res) => {
  const { username, password, email, phone } = req.body;
  if (!username || !password) return res.status(400).json({ message: '用户名和密码不能为空' });
  if (username.length < 3) return res.status(400).json({ message: '用户名至少3个字符' });
  if (password.length < 6) return res.status(400).json({ message: '密码至少6个字符' });

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(400).json({ message: '用户名已存在' });

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password, email, phone) VALUES (?, ?, ?, ?)').run(username, hashedPassword, email || null, phone || null);

  const token = jwt.sign({ id: result.lastInsertRowid, username, role: 'customer' }, SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: result.lastInsertRowid, username, role: 'customer', email, phone } });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: '用户名和密码不能为空' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(400).json({ message: '用户名或密码错误' });

  if (!bcrypt.compareSync(password, user.password)) return res.status(400).json({ message: '用户名或密码错误' });

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role, email: user.email, phone: user.phone, avatar: user.avatar }
  });
});

router.get('/me', authMiddleware, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, username, role, email, phone, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ message: '用户不存在' });
  res.json(user);
});

module.exports = router;
