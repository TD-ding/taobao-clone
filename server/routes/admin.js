const express = require('express');
const getDb = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

// Products CRUD
router.get('/products', (req, res) => {
  const db = getDb();
  const { keyword, status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = '';
  const params = [];
  const conditions = [];
  if (keyword) { conditions.push('p.name LIKE ?'); params.push(`%${keyword}%`); }
  if (status) { conditions.push('p.status = ?'); params.push(status); }
  if (conditions.length) where = 'WHERE ' + conditions.join(' AND ');

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM products p ${where}`).get(...params);
  const products = db.prepare(
    `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, parseInt(limit), offset);

  res.json({ products, total: countRow.total, page: parseInt(page), totalPages: Math.ceil(countRow.total / parseInt(limit)) });
});

router.post('/products', (req, res) => {
  const { name, description, price, original_price, image, images, category_id, stock, status } = req.body;
  if (!name || price === undefined) return res.status(400).json({ message: '商品名称和价格不能为空' });

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO products (name, description, price, original_price, image, images, category_id, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(name, description || null, price, original_price || null, image || null, images || null, category_id || null, stock || 0, status || 'active');

  res.json({ message: '商品创建成功', id: result.lastInsertRowid });
});

router.put('/products/:id', (req, res) => {
  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ message: '商品不存在' });

  const { name, description, price, original_price, image, images, category_id, stock, status } = req.body;
  db.prepare(
    `UPDATE products SET name=COALESCE(?,name), description=COALESCE(?,description), price=COALESCE(?,price),
     original_price=COALESCE(?,original_price), image=COALESCE(?,image), images=COALESCE(?,images),
     category_id=COALESCE(?,category_id), stock=COALESCE(?,stock), status=COALESCE(?,status) WHERE id=?`
  ).run(name || null, description || null, price ?? null, original_price ?? null, image || null, images || null, category_id ?? null, stock ?? null, status || null, req.params.id);

  res.json({ message: '商品更新成功' });
});

router.delete('/products/:id', (req, res) => {
  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ message: '商品不存在' });
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: '商品已删除' });
});

// Orders management
router.get('/orders', (req, res) => {
  const db = getDb();
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = '';
  const params = [];
  if (status) { where = 'WHERE o.status = ?'; params.push(status); }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM orders o ${where}`).get(...params);
  const orders = db.prepare(
    `SELECT o.*, u.username FROM orders o LEFT JOIN users u ON o.user_id = u.id ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, parseInt(limit), offset);

  const ordersWithItems = orders.map(order => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    return { ...order, items };
  });

  res.json({ orders: ordersWithItems, total: countRow.total, page: parseInt(page), totalPages: Math.ceil(countRow.total / parseInt(limit)) });
});

router.put('/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ message: '无效的订单状态' });

  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ message: '订单不存在' });

  db.prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, req.params.id);
  res.json({ message: '订单状态已更新' });
});

// Users management
router.get('/users', (req, res) => {
  const db = getDb();
  const { keyword, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = '';
  const params = [];
  if (keyword) { where = 'WHERE username LIKE ? OR email LIKE ?'; params.push(`%${keyword}%`, `%${keyword}%`); }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM users ${where}`).get(...params);
  const users = db.prepare(
    `SELECT id, username, role, email, phone, avatar, created_at FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, parseInt(limit), offset);

  res.json({ users, total: countRow.total, page: parseInt(page), totalPages: Math.ceil(countRow.total / parseInt(limit)) });
});

router.put('/users/:id/role', (req, res) => {
  const { role } = req.body;
  if (!['customer', 'admin'].includes(role)) return res.status(400).json({ message: '无效角色' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ message: '用户不存在' });

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json({ message: '用户角色已更新' });
});

router.delete('/users/:id', (req, res) => {
  const db = getDb();
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ message: '不能删除自己' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ message: '用户不存在' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: '用户已删除' });
});

module.exports = router;
