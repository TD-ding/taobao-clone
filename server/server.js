const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const statsRoutes = require('./routes/stats');
const initDatabase = require('./init-db');

const app = express();
const PORT = process.env.PORT || 3001;

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: corsOrigin.split(',').map(s => s.trim()),
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stats', statsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器内部错误' });
});

const dbPath = path.join(__dirname, 'data', 'taobao.db');
if (!fs.existsSync(dbPath)) {
  console.log('Database not found, initializing...');
  initDatabase();
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
