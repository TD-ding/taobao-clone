const express = require('express');
const getDb = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Get user profile
router.get('/profile', (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, username, email, phone, avatar, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ message: '用户不存在' });
  res.json(user);
});

// Update user profile
router.put('/profile', (req, res) => {
  const { email, phone, avatar } = req.body;
  const db = getDb();
  db.prepare('UPDATE users SET email = ?, phone = ?, avatar = ? WHERE id = ?')
    .run(email || null, phone || null, avatar || null, req.user.id);
  const updated = db.prepare('SELECT id, username, email, phone, avatar, role, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ message: '更新成功', user: updated });
});

// Get saved addresses
router.get('/addresses', (req, res) => {
  const db = getDb();
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(req.user.id);
  res.json(addresses);
});

// Add address
router.post('/addresses', (req, res) => {
  const { name, phone, address, is_default } = req.body;
  if (!address) return res.status(400).json({ message: '地址不能为空' });
  if (!phone) return res.status(400).json({ message: '电话不能为空' });

  const db = getDb();
  if (is_default) {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  }
  const result = db.prepare(
    'INSERT INTO addresses (user_id, name, phone, address, is_default) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.id, name || null, phone, address, is_default ? 1 : 0);
  res.json({ message: '地址添加成功', id: result.lastInsertRowid });
});

// Update address
router.put('/addresses/:id', (req, res) => {
  const { name, phone, address, is_default } = req.body;
  const db = getDb();
  const addr = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!addr) return res.status(404).json({ message: '地址不存在' });

  if (is_default) {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  }
  db.prepare('UPDATE addresses SET name = ?, phone = ?, address = ?, is_default = ? WHERE id = ?')
    .run(name || null, phone, address, is_default ? 1 : 0, req.params.id);
  res.json({ message: '地址更新成功' });
});

// Delete address
router.delete('/addresses/:id', (req, res) => {
  const db = getDb();
  const addr = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!addr) return res.status(404).json({ message: '地址不存在' });
  db.prepare('DELETE FROM addresses WHERE id = ?').run(req.params.id);
  res.json({ message: '地址已删除' });
});

// Get favorites
router.get('/favorites', (req, res) => {
  const db = getDb();
  const favorites = db.prepare(
    `SELECT f.id as favorite_id, f.created_at as favorited_at, p.* FROM favorites f
     JOIN products p ON f.product_id = p.id WHERE f.user_id = ? ORDER BY f.created_at DESC`
  ).all(req.user.id);
  res.json(favorites);
});

// Add favorite
router.post('/favorites', (req, res) => {
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ message: '商品ID不能为空' });

  const db = getDb();
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ message: '商品不存在' });

  const existing = db.prepare('SELECT * FROM favorites WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);
  if (existing) return res.status(400).json({ message: '已收藏该商品' });

  db.prepare('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)').run(req.user.id, product_id);
  res.json({ message: '收藏成功' });
});

// Remove favorite
router.delete('/favorites/:product_id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND product_id = ?').run(req.user.id, req.params.product_id);
  res.json({ message: '已取消收藏' });
});

// Check if favorited
router.get('/favorites/check/:product_id', (req, res) => {
  const db = getDb();
  const fav = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND product_id = ?').get(req.user.id, req.params.product_id);
  res.json({ favorited: !!fav });
});

// Get reviews for a product
router.get('/reviews/:product_id', (req, res) => {
  const db = getDb();
  const reviews = db.prepare(
    `SELECT r.*, u.username, u.avatar FROM reviews r
     JOIN users u ON r.user_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC`
  ).all(req.params.product_id);
  res.json(reviews);
});

// Create review
router.post('/reviews', (req, res) => {
  const { product_id, rating, content } = req.body;
  if (!product_id) return res.status(400).json({ message: '商品ID不能为空' });
  if (!content) return res.status(400).json({ message: '评价内容不能为空' });
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: '评分需在1-5之间' });

  const db = getDb();
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ message: '商品不存在' });

  const existing = db.prepare('SELECT id FROM reviews WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);
  if (existing) return res.status(400).json({ message: '已评价过该商品' });

  db.prepare('INSERT INTO reviews (user_id, product_id, rating, content) VALUES (?, ?, ?, ?)')
    .run(req.user.id, product_id, rating, content);

  // Update product average rating
  const stats = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE product_id = ?').get(product_id);
  db.prepare('UPDATE products SET rating = ? WHERE id = ?').run(Math.round(stats.avg_rating * 10) / 10, product_id);

  res.json({ message: '评价成功' });
});

module.exports = router;
