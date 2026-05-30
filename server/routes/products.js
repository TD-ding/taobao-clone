const express = require('express');
const getDb = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { keyword, category_id, min_price, max_price, sort, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = "WHERE p.status = 'active'";
  const params = [];

  if (keyword) { where += ' AND p.name LIKE ?'; params.push(`%${keyword}%`); }
  if (category_id) { where += ' AND p.category_id = ?'; params.push(category_id); }
  if (min_price) { where += ' AND p.price >= ?'; params.push(parseFloat(min_price)); }
  if (max_price) { where += ' AND p.price <= ?'; params.push(parseFloat(max_price)); }

  let orderBy = 'ORDER BY p.created_at DESC';
  if (sort === 'price_asc') orderBy = 'ORDER BY p.price ASC';
  if (sort === 'price_desc') orderBy = 'ORDER BY p.price DESC';
  if (sort === 'sales') orderBy = 'ORDER BY p.sales DESC';
  if (sort === 'rating') orderBy = 'ORDER BY p.rating DESC';

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM products p ${where}`).get(...params);
  const products = db.prepare(
    `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ${where} ${orderBy} LIMIT ? OFFSET ?`
  ).all(...params, parseInt(limit), offset);

  res.json({ products, total: countRow.total, page: parseInt(page), totalPages: Math.ceil(countRow.total / parseInt(limit)) });
});

router.get('/categories', (req, res) => {
  const db = getDb();
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
  res.json(categories);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const product = db.prepare('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ message: '商品不存在' });
  res.json(product);
});

module.exports = router;
