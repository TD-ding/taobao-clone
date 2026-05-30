const getDb = require('./db');
const bcrypt = require('bcryptjs');

function initDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
      email TEXT,
      phone TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      image TEXT,
      images TEXT,
      category_id INTEGER,
      stock INTEGER DEFAULT 0,
      sales INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
      address TEXT,
      phone TEXT,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      product_name TEXT NOT NULL,
      product_image TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  // Seed admin user
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hashedPassword, 'admin');
  }

  // Seed categories
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (catCount.count === 0) {
    const cats = [
      { name: '手机数码', icon: '📱', sort_order: 1 },
      { name: '电脑办公', icon: '💻', sort_order: 2 },
      { name: '家用电器', icon: '🏠', sort_order: 3 },
      { name: '服饰鞋包', icon: '👗', sort_order: 4 },
      { name: '美妆护肤', icon: '💄', sort_order: 5 },
      { name: '食品生鲜', icon: '🍎', sort_order: 6 },
      { name: '图书文具', icon: '📚', sort_order: 7 },
      { name: '运动户外', icon: '⚽', sort_order: 8 },
    ];
    const insertCat = db.prepare('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)');
    for (const c of cats) insertCat.run(c.name, c.icon, c.sort_order);
  }

  // Seed products
  const prodCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (prodCount.count === 0) {
    const products = [
      { name: 'iPhone 15 Pro Max', description: '苹果最新旗舰手机，A17 Pro芯片，钛金属设计', price: 9999, original_price: 10999, category_id: 1, stock: 100, sales: 523 },
      { name: '华为 Mate 60 Pro', description: '麒麟芯片回归，卫星通话功能', price: 6999, original_price: 7999, category_id: 1, stock: 200, sales: 876 },
      { name: '小米14 Ultra', description: '徕卡光学镜头，骁龙8 Gen3', price: 5999, original_price: 6499, category_id: 1, stock: 150, sales: 432 },
      { name: 'MacBook Pro 16寸', description: 'M3 Max芯片，专业创作利器', price: 19999, original_price: 21999, category_id: 2, stock: 50, sales: 156 },
      { name: '联想 ThinkPad X1 Carbon', description: '商务轻薄笔记本，14寸2.8K屏', price: 8999, original_price: 9999, category_id: 2, stock: 80, sales: 234 },
      { name: '戴尔 U2723QE 4K显示器', description: '27寸4K IPS Black面板', price: 3299, original_price: 3699, category_id: 2, stock: 120, sales: 189 },
      { name: '海尔冰箱 BCD-470', description: '470L大容量，变频节能', price: 2999, original_price: 3599, category_id: 3, stock: 60, sales: 312 },
      { name: '美的空调 KFR-35GW', description: '1.5匹新一级能效，自清洁', price: 2199, original_price: 2599, category_id: 3, stock: 200, sales: 567 },
      { name: 'Nike Air Max 270', description: '气垫缓震跑步鞋，透气网面', price: 899, original_price: 1299, category_id: 4, stock: 300, sales: 765 },
      { name: '优衣库羽绒服', description: '轻薄保暖，多色可选', price: 499, original_price: 799, category_id: 4, stock: 500, sales: 1234 },
      { name: '兰蔻小黑瓶精华', description: '修护肌底，抗初老精华', price: 760, original_price: 980, category_id: 5, stock: 200, sales: 890 },
      { name: 'SK-II 神仙水', description: 'PITERA™精华，晶莹剔透', price: 1190, original_price: 1540, category_id: 5, stock: 150, sales: 678 },
      { name: '三只松鼠坚果礼盒', description: '每日坚果混合装750g', price: 89, original_price: 129, category_id: 6, stock: 1000, sales: 2345 },
      { name: '有机草莓 2斤装', description: '新鲜采摘，顺丰冷链', price: 59, original_price: 79, category_id: 6, stock: 500, sales: 1567 },
      { name: '《人类简史》', description: '尤瓦尔·赫拉利著，全球畅销', price: 39, original_price: 68, category_id: 7, stock: 800, sales: 987 },
      { name: '得力文具套装', description: '学生文具大礼包30件', price: 29, original_price: 49, category_id: 7, stock: 600, sales: 876 },
      { name: '迪卡侬跑步机', description: '家用折叠跑步机，静音电机', price: 1999, original_price: 2999, category_id: 8, stock: 40, sales: 123 },
      { name: 'Yonex羽毛球拍', description: '天斧100ZZ，进攻型拍', price: 1280, original_price: 1580, category_id: 8, stock: 80, sales: 234 },
    ];
    const insertProd = db.prepare(
      'INSERT INTO products (name, description, price, original_price, category_id, stock, sales) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    for (const p of products) insertProd.run(p.name, p.description, p.price, p.original_price, p.category_id, p.stock, p.sales);
  }

  console.log('Database initialized successfully!');
  console.log('Admin user: admin / admin123');
}

initDatabase();