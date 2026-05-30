const express = require('express');
const getDb = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/cart', (req, res) => {
  const db = getDb();
  const items = db.prepare(
    `SELECT ci.*, p.name as product_name, p.price, p.image, p.stock, p.status as product_status
     FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id = ? ORDER BY ci.created_at DESC`
  ).all(req.user.id);
  res.json(items);
});

router.post('/cart', (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ message: '商品ID不能为空' });
  if (quantity < 1) return res.status(400).json({ message: '数量不能小于1' });

  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND status = ?').get(product_id, 'active');
  if (!product) return res.status(400).json({ message: '商品不存在或已下架' });

  const existing = db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);
  const newQty = existing ? existing.quantity + quantity : quantity;
  if (newQty > product.stock) return res.status(400).json({ message: `库存不足，最多可加 ${product.stock} 件` });

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(req.user.id, product_id, quantity);
  }
  res.json({ message: '已加入购物车' });
});

router.put('/cart/:id', (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ message: '数量不能小于1' });

  const db = getDb();
  const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!item) return res.status(404).json({ message: '购物车项目不存在' });

  const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(item.product_id);
  if (product && quantity > product.stock) return res.status(400).json({ message: `库存不足，最多 ${product.stock} 件` });

  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, item.id);
  res.json({ message: '已更新' });
});

router.delete('/cart/:id', (req, res) => {
  const db = getDb();
  const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!item) return res.status(404).json({ message: '购物车项目不存在' });

  db.prepare('DELETE FROM cart_items WHERE id = ?').run(item.id);
  res.json({ message: '已删除' });
});

router.delete('/cart', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
  res.json({ message: '购物车已清空' });
});

module.exports = router;
