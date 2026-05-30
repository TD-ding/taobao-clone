const express = require('express');
const getDb = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { escapeLike, sanitizePagination } = require('./products');

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

// Products CRUD
router.get('/products', (req, res) => {
  const db = getDb();
  const { keyword, status } = req.query;
  const { page, limit, offset } = sanitizePagination(req.query.page, req.query.limit);

  let where = '';
  const params = [];
  const conditions = [];
  if (keyword) {
    conditions.push('p.name LIKE ? ESCAPE ?');
    params.push(`%${escapeLike(keyword)}%`, '\\');
  }
  if (status) { conditions.push('p.status = ?'); params.push(status); }
  if (conditions.length) where = 'WHERE ' + conditions.join(' AND ');

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM products p ${where}`).get(...params);
  const products = db.prepare(
    `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);

  res.json({ products, total: countRow.total, page, totalPages: Math.ceil(countRow.total / limit) });
});

router.post('/products', (req, res) => {
  const { name, description, price, original_price, image, images, category_id, stock, status } = req.body;
  if (!name || price === undefined || price === null) return res.status(400).json({ message: '商品名称和价格不能为空' });
  if (typeof price !== 'number' || price < 0) return res.status(400).json({ message: '价格不能为负数' });

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

  const updates = {};
  const values = [];
  const allowedFields = ['name', 'description', 'price', 'original_price', 'image', 'images', 'category_id', 'stock', 'status'];

  for (const field of allowedFields) {
    if (field in req.body) {
      const val = req.body[field];
      if (field === 'price' && (typeof val !== 'number' || val < 0)) {
        return res.status(400).json({ message: '价格不能为负数' });
      }
      updates[field] = val === '' ? null : (val ?? null);
      values.push(updates[field]);
    }
  }

  if (!values.length) return res.status(400).json({ message: '没有要更新的字段' });

  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  values.push(req.params.id);
  db.prepare(`UPDATE products SET ${setClause} WHERE id = ?`).run(...values);

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
  const { status, keyword } = req.query;
  const { page, limit, offset } = sanitizePagination(req.query.page, req.query.limit);

  const conditions = [];
  const params = [];
  if (status) { conditions.push('o.status = ?'); params.push(status); }
  if (keyword) {
    const escaped = escapeLike(keyword);
    conditions.push('(o.id LIKE ? ESCAPE ? OR u.username LIKE ? ESCAPE ?)');
    params.push(`%${escaped}%`, '\\', `%${escaped}%`, '\\');
  }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM orders o ${where}`).get(...params);
  const orders = db.prepare(
    `SELECT o.*, u.username FROM orders o LEFT JOIN users u ON o.user_id = u.id ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);

  const orderIds = orders.map(o => o.id);
  let itemsByOrder = {};
  if (orderIds.length) {
    const placeholders = orderIds.map(() => '?').join(',');
    const allItems = db.prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`).all(...orderIds);
    for (const item of allItems) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push(item);
    }
  }

  const ordersWithItems = orders.map(order => ({ ...order, items: itemsByOrder[order.id] || [] }));
  res.json({ orders: ordersWithItems, total: countRow.total, page, totalPages: Math.ceil(countRow.total / limit) });
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

// Categories CRUD
router.get('/categories', (req, res) => {
  const db = getDb();
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
  res.json(categories);
});

router.post('/categories', (req, res) => {
  const { name, icon, sort_order } = req.body;
  if (!name) return res.status(400).json({ message: '分类名称不能为空' });
  const db = getDb();
  const result = db.prepare('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)')
    .run(name, icon || null, sort_order || 0);
  res.json({ message: '分类创建成功', id: result.lastInsertRowid });
});

router.put('/categories/:id', (req, res) => {
  const { name, icon, sort_order } = req.body;
  const db = getDb();
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!cat) return res.status(404).json({ message: '分类不存在' });

  const updates = {};
  const values = [];
  if (name !== undefined) { updates.name = name; values.push(name); }
  if (icon !== undefined) { updates.icon = icon === '' ? null : icon; values.push(updates.icon); }
  if (sort_order !== undefined) { updates.sort_order = sort_order; values.push(sort_order); }
  if (!values.length) return res.status(400).json({ message: '没有要更新的字段' });

  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  values.push(req.params.id);
  db.prepare(`UPDATE categories SET ${setClause} WHERE id = ?`).run(...values);
  res.json({ message: '分类更新成功' });
});

router.delete('/categories/:id', (req, res) => {
  const db = getDb();
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!cat) return res.status(404).json({ message: '分类不存在' });
  db.prepare('UPDATE products SET category_id = NULL WHERE category_id = ?').run(req.params.id);
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ message: '分类已删除' });
});

// Users management
router.get('/users', (req, res) => {
  const db = getDb();
  const { keyword } = req.query;
  const { page, limit, offset } = sanitizePagination(req.query.page, req.query.limit);

  let where = '';
  const params = [];
  if (keyword) {
    const escaped = escapeLike(keyword);
    where = 'WHERE username LIKE ? ESCAPE ? OR email LIKE ? ESCAPE ?';
    params.push(`%${escaped}%`, '\\', `%${escaped}%`, '\\');
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM users ${where}`).get(...params);
  const users = db.prepare(
    `SELECT id, username, role, email, phone, avatar, created_at FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);

  res.json({ users, total: countRow.total, page, totalPages: Math.ceil(countRow.total / limit) });
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

  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)').run(req.params.id);
    db.prepare('DELETE FROM orders WHERE user_id = ?').run(req.params.id);
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.params.id);
    db.prepare('DELETE FROM favorites WHERE user_id = ?').run(req.params.id);
    db.prepare('DELETE FROM addresses WHERE user_id = ?').run(req.params.id);
    db.prepare('DELETE FROM reviews WHERE user_id = ?').run(req.params.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  });
  transaction();

  res.json({ message: '用户已删除' });
});

module.exports = router;
