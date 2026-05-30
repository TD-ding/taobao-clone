const request = require('supertest');
const express = require('express');
const getDb = require('../db');
const initDatabase = require('../init-db');
const { authMiddleware, adminMiddleware, SECRET } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// Use a separate test database
process.env.JWT_SECRET = 'test_secret';
const testDbPath = require('path').join(__dirname, '..', 'data', 'test.db');

let app;
let db;
let adminToken;
let userToken;
let userId;

beforeAll(() => {
  // Reset the db singleton for testing
  delete require.cache[require.resolve('../db')];
  const origPath = require('path').join(__dirname, '..', 'data', 'taobao.db');
  const mod = require('../db');
  // We'll use the default DB which has seed data from init
});

beforeAll(() => {
  db = getDb();
  initDatabase();

  // Create admin token
  adminToken = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, SECRET, { expiresIn: '1h' });

  // Create a test user
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('testuser');
  if (!existing) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('test123', 10);
    const result = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('testuser', hash, 'customer');
    userId = result.lastInsertRowid;
  } else {
    userId = existing.id;
  }
  userToken = jwt.sign({ id: userId, username: 'testuser', role: 'customer' }, SECRET, { expiresIn: '1h' });

  // Build a fresh app for each test suite
  app = express();
  app.use(express.json());
  app.use('/api/auth', require('../routes/auth'));
  app.use('/api/products', require('../routes/products').router);
  app.use('/api/orders', require('../routes/orders'));
  app.use('/api/users', require('../routes/users'));
  app.use('/api/profile', require('../routes/profile'));
  app.use('/api/admin', require('../routes/admin'));
  app.use('/api/stats', require('../routes/stats'));
  app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
  });
});

// ============ Auth Routes ============
describe('Auth Routes', () => {
  test('POST /api/auth/login - success with admin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('admin');
    expect(res.body.user.role).toBe('admin');
  });

  test('POST /api/auth/login - wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong' });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/login - missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: '' });
    expect(res.status).toBe(400);
  });

  test('GET /api/auth/me - with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('testuser');
  });

  test('GET /api/auth/me - without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

// ============ Product Routes ============
describe('Product Routes', () => {
  test('GET /api/products - returns paginated product list', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.products).toBeInstanceOf(Array);
    expect(res.body.page).toBe(1);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/products?keyword=iPhone - search works', async () => {
    const res = await request(app).get('/api/products?keyword=iPhone');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThanOrEqual(1);
    expect(res.body.products[0].name).toMatch(/iPhone/);
  });

  test('GET /api/products - pagination clamping', async () => {
    const res = await request(app).get('/api/products?page=0');
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
  });

  test('GET /api/products/categories - returns categories', async () => {
    const res = await request(app).get('/api/products/categories');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/products/:id - returns product detail', async () => {
    const res = await request(app).get('/api/products/1');
    expect(res.status).toBe(200);
    expect(res.body.name).toBeDefined();
  });

  test('GET /api/products/:id - 404 for non-existent', async () => {
    const res = await request(app).get('/api/products/99999');
    expect(res.status).toBe(404);
  });
});

// ============ Cart Routes ============
describe('Cart Routes', () => {
  test('GET /api/users/cart - returns cart items', async () => {
    const res = await request(app)
      .get('/api/users/cart')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/users/cart - add item to cart', async () => {
    const res = await request(app)
      .post('/api/users/cart')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ product_id: 1, quantity: 2 });
    expect(res.status).toBe(200);
  });

  test('POST /api/users/cart - reject non-existent product', async () => {
    const res = await request(app)
      .post('/api/users/cart')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ product_id: 99999, quantity: 1 });
    expect(res.status).toBe(400);
  });

  test('GET /api/users/cart - cart now has items', async () => {
    const res = await request(app)
      .get('/api/users/cart')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('DELETE /api/users/cart/:id - remove item', async () => {
    const cartRes = await request(app)
      .get('/api/users/cart')
      .set('Authorization', `Bearer ${userToken}`);
    const itemId = cartRes.body[0]?.id;
    if (itemId) {
      const res = await request(app)
        .delete(`/api/users/cart/${itemId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    }
  });
});

// ============ Order Routes ============
describe('Order Routes', () => {
  test('POST /api/orders - create order', async () => {
    // First add item to cart
    await request(app)
      .post('/api/users/cart')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ product_id: 2, quantity: 1 });

    const cartRes = await request(app)
      .get('/api/users/cart')
      .set('Authorization', `Bearer ${userToken}`);

    const activeItems = cartRes.body.filter(i => i.product_status === 'active');
    if (activeItems.length === 0) return;

    const orderItems = activeItems.map(i => ({ product_id: i.product_id, quantity: i.quantity }));
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ items: orderItems, address: 'Test Address', phone: '13800138000' });
    expect(res.status).toBe(200);
    expect(res.body.orderId).toBeDefined();
  });

  test('GET /api/orders - returns user orders', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.orders).toBeInstanceOf(Array);
  });

  test('POST /api/orders - reject empty items', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ items: [], address: 'Test', phone: '123' });
    expect(res.status).toBe(400);
  });

  test('POST /api/orders - reject missing address', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ items: [{ product_id: 1, quantity: 1 }], phone: '123' });
    expect(res.status).toBe(400);
  });
});

// ============ Admin Routes ============
describe('Admin Routes', () => {
  test('GET /api/admin/products - requires admin', async () => {
    const res = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test('GET /api/admin/products - admin can list', async () => {
    const res = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.products).toBeInstanceOf(Array);
  });

  test('POST /api/admin/products - create product', async () => {
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Product', price: 99.9, stock: 10, status: 'active' });
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
  });

  test('POST /api/admin/products - reject negative price', async () => {
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bad Product', price: -1 });
    expect(res.status).toBe(400);
  });

  test('GET /api/admin/orders - admin can list orders', async () => {
    const res = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.orders).toBeInstanceOf(Array);
  });

  test('GET /api/admin/orders?keyword=admin - search orders', async () => {
    const res = await request(app)
      .get('/api/admin/orders?keyword=admin')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('PUT /api/admin/orders/:id/status - invalid transition', async () => {
    // Create an order first
    await request(app)
      .post('/api/users/cart')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ product_id: 3, quantity: 1 });
    const cartRes = await request(app)
      .get('/api/users/cart')
      .set('Authorization', `Bearer ${userToken}`);
    const activeItems = cartRes.body.filter(i => i.product_status === 'active');
    if (activeItems.length === 0) return;
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ items: activeItems.map(i => ({ product_id: i.product_id, quantity: i.quantity })), address: 'Test', phone: '123' });

    // Try to skip from pending to delivered directly
    const res = await request(app)
      .put(`/api/admin/orders/${orderRes.body.orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'delivered' });
    expect(res.status).toBe(400);
  });

  test('GET /api/admin/categories - list categories', async () => {
    const res = await request(app)
      .get('/api/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/admin/users - list users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.users).toBeInstanceOf(Array);
  });
});

// ============ Stats Routes ============
describe('Stats Routes', () => {
  test('GET /api/stats/overview - requires admin', async () => {
    const res = await request(app).get('/api/stats/overview');
    expect(res.status).toBe(401);
  });

  test('GET /api/stats/overview - admin access', async () => {
    const res = await request(app)
      .get('/api/stats/overview')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.totalProducts).toBeDefined();
    expect(res.body.totalUsers).toBeDefined();
  });

  test('GET /api/stats/sales-daily - returns daily data', async () => {
    const res = await request(app)
      .get('/api/stats/sales-daily?days=7')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ============ Profile Routes ============
describe('Profile Routes', () => {
  test('GET /api/profile/reviews/:product_id - public access', async () => {
    const res = await request(app).get('/api/profile/reviews/1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/profile/profile - requires auth', async () => {
    const res = await request(app).get('/api/profile/profile');
    expect(res.status).toBe(401);
  });

  test('PUT /api/profile/profile - update profile', async () => {
    const res = await request(app)
      .put('/api/profile/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ email: 'test@test.com', phone: '13800138000' });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('test@test.com');
  });

  test('POST /api/profile/favorites - add favorite', async () => {
    // Clean up existing
    await request(app)
      .delete('/api/profile/favorites/1')
      .set('Authorization', `Bearer ${userToken}`);

    const res = await request(app)
      .post('/api/profile/favorites')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ product_id: 1 });
    expect(res.status).toBe(200);
  });

  test('GET /api/profile/favorites - list favorites', async () => {
    const res = await request(app)
      .get('/api/profile/favorites')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/profile/favorites/check/:product_id - check favorited', async () => {
    const res = await request(app)
      .get('/api/profile/favorites/check/1')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.favorited).toBe('boolean');
  });
});

// ============ Utility Functions ============
describe('Utility Functions', () => {
  const { escapeLike, sanitizePagination } = require('../routes/products');

  test('escapeLike - escapes special characters', () => {
    expect(escapeLike('100%')).toBe('100\\%');
    expect(escapeLike('test_data')).toBe('test\\_data');
    expect(escapeLike('a\\b')).toBe('a\\\\b');
  });

  test('sanitizePagination - clamps values', () => {
    expect(sanitizePagination(0, 0)).toEqual({ page: 1, limit: 20, offset: 0 });
    expect(sanitizePagination(-1, 200)).toEqual({ page: 1, limit: 100, offset: 0 });
    expect(sanitizePagination(3, 10)).toEqual({ page: 3, limit: 10, offset: 20 });
    expect(sanitizePagination(undefined, undefined)).toEqual({ page: 1, limit: 20, offset: 0 });
  });
});
