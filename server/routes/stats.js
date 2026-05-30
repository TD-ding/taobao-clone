const express = require('express');
const getDb = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

router.get('/overview', (req, res) => {
  const db = getDb();
  const row = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM products WHERE status = 'active') as totalProducts,
      (SELECT COUNT(*) FROM users) as totalUsers,
      (SELECT COUNT(*) FROM orders) as totalOrders,
      (SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE status != 'cancelled') as totalRevenue,
      (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pendingOrders,
      (SELECT COUNT(*) FROM orders WHERE status = 'shipped') as shippedOrders
  `).get();

  res.json(row);
});

router.get('/sales-daily', (req, res) => {
  const db = getDb();
  const { days = 7 } = req.query;
  const rows = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as order_count, COALESCE(SUM(total_price), 0) as revenue
    FROM orders WHERE status != 'cancelled' AND created_at >= DATE('now', '-' || ? || ' days')
    GROUP BY DATE(created_at) ORDER BY date ASC
  `).all(parseInt(days));
  res.json(rows);
});

router.get('/category-stats', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.name as category, COUNT(p.id) as product_count, COALESCE(SUM(p.sales), 0) as total_sales
    FROM categories c LEFT JOIN products p ON c.id = p.category_id
    GROUP BY c.id ORDER BY total_sales DESC
  `).all();
  res.json(rows);
});

router.get('/top-products', (req, res) => {
  const db = getDb();
  const { limit = 10 } = req.query;
  const rows = db.prepare(
    "SELECT name, price, sales, stock FROM products WHERE status = 'active' ORDER BY sales DESC LIMIT ?"
  ).all(parseInt(limit));
  res.json(rows);
});

module.exports = router;
