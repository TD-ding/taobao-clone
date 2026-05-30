const express = require('express');
const getDb = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

router.get('/overview', (req, res) => {
  const db = getDb();

  const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products WHERE status = 'active'").get().count;
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_price), 0) as sum FROM orders WHERE status != 'cancelled'").get().sum;

  const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get().count;
  const shippedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'shipped'").get().count;

  res.json({ totalProducts, totalUsers, totalOrders, totalRevenue, pendingOrders, shippedOrders });
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
