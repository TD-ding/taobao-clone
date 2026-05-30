const express = require('express');
const getDb = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { sanitizePagination } = require('./products');

const router = express.Router();

router.use(authMiddleware);

router.post('/', (req, res) => {
  const { items, address, phone, note } = req.body;
  if (!items?.length) return res.status(400).json({ message: '订单不能为空' });
  if (!address) return res.status(400).json({ message: '收货地址不能为空' });
  if (!phone) return res.status(400).json({ message: '联系电话不能为空' });

  const db = getDb();

  const transaction = db.transaction(() => {
    let totalPrice = 0;
    const orderItems = [];

    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ? AND status = ?').get(item.product_id, 'active');
      if (!product) throw new Error(`商品ID ${item.product_id} 不存在或已下架`);
      if (product.stock < item.quantity) throw new Error(`${product.name} 库存不足`);
      totalPrice += product.price * item.quantity;
      orderItems.push({ ...item, product, price: product.price });
    }

    const orderResult = db.prepare(
      'INSERT INTO orders (user_id, total_price, status, address, phone, note) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, totalPrice, 'pending', address, phone, note || null);

    for (const item of orderItems) {
      db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price, product_name, product_image) VALUES (?, ?, ?, ?, ?, ?)')
        .run(orderResult.lastInsertRowid, item.product_id, item.quantity, item.price, item.product.name, item.product.image);
      db.prepare('UPDATE products SET stock = stock - ?, sales = sales + ? WHERE id = ?')
        .run(item.quantity, item.quantity, item.product_id);
      db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?')
        .run(req.user.id, item.product_id);
    }

    return orderResult.lastInsertRowid;
  });

  try {
    const orderId = transaction();
    res.json({ message: '下单成功', orderId });
  } catch (e) {
    res.status(400).json({ message: e.message || '下单失败，请重试' });
  }
});

router.get('/', (req, res) => {
  const db = getDb();
  const { status } = req.query;
  const { page, limit, offset } = sanitizePagination(req.query.page, req.query.limit, 50);

  let where = 'WHERE o.user_id = ?';
  const params = [req.user.id];
  if (status) { where += ' AND o.status = ?'; params.push(status); }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM orders o ${where}`).get(...params);
  const orders = db.prepare(
    `SELECT o.* FROM orders o ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`
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

router.get('/:id', (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ message: '订单不存在' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items });
});

router.put('/:id/cancel', (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ message: '订单不存在' });
  if (order.status !== 'pending') return res.status(400).json({ message: '只能取消待付款订单' });

  const transaction = db.transaction(() => {
    db.prepare("UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(order.id);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    for (const item of items) {
      db.prepare('UPDATE products SET stock = stock + ?, sales = sales - ? WHERE id = ?').run(item.quantity, item.quantity, item.product_id);
    }
  });
  transaction();

  res.json({ message: '订单已取消' });
});

module.exports = router;
