# 淘淘购物 - Taobao Clone

一个类似淘宝的购物网站，包含前端商城、后端 API 和管理员后台。

## 技术栈

- **前端**: React 18 + React Router 6
- **后端**: Node.js + Express
- **数据库**: SQLite (better-sqlite3)
- **认证**: JWT (JSON Web Token)
- **文件上传**: Multer

## 功能

### 前端商城
- 商品浏览与搜索
- 分类筛选
- 价格/销量/评分排序
- 购物车管理
- 下单与订单查看
- 用户注册/登录

### 后端 API
- RESTful API 设计
- JWT 用户认证
- 商品管理（增删改查）
- 订单管理
- 购物车管理
- 图片上传

### 管理员后台
- 数据看板（营收、订单、用户统计）
- 商品管理（增删改查、上下架）
- 订单管理（状态流转）
- 用户管理（角色切换、删除）

## 快速开始

### 1. 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 2. 初始化数据库

```bash
cd server
npm run init-db
```

### 3. 启动服务

```bash
# 启动后端 (端口 3001)
cd server
npm run dev

# 启动前端 (端口 3000)
cd client
npm start
```

### 4. 访问

- 前端商城: http://localhost:3000
- 管理员后台: http://localhost:3000/admin
- 管理员账号: `admin` / `admin123`

## 项目结构

```
taobao-clone/
├── server/                  # 后端
│   ├── server.js           # 入口文件
│   ├── db.js               # 数据库连接
│   ├── init-db.js          # 数据库初始化与种子数据
│   ├── middleware/
│   │   └── auth.js         # JWT 认证中间件
│   ├── routes/
│   │   ├── auth.js         # 认证路由
│   │   ├── products.js     # 商品路由
│   │   ├── orders.js       # 订单路由
│   │   ├── users.js        # 用户/购物车路由
│   │   ├── admin.js        # 管理员路由
│   │   ├── upload.js       # 图片上传路由
│   │   └── stats.js        # 数据统计路由
│   └── uploads/            # 上传图片目录
├── client/                  # 前端
│   ├── public/
│   └── src/
│       ├── App.js
│       ├── context/        # AuthContext
│       ├── utils/          # API 工具
│       ├── components/     # 通用组件
│       ├── pages/          # 页面组件
│       │   └── admin/      # 管理员页面
│       └── styles/         # CSS 样式
└── README.md
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/me | 获取当前用户 |
| GET | /api/products | 商品列表 |
| GET | /api/products/categories | 分类列表 |
| GET | /api/products/:id | 商品详情 |
| GET | /api/users/cart | 购物车列表 |
| POST | /api/users/cart | 添加购物车 |
| PUT | /api/users/cart/:id | 更新数量 |
| DELETE | /api/users/cart/:id | 删除购物车项 |
| POST | /api/orders | 创建订单 |
| GET | /api/orders | 订单列表 |
| GET | /api/orders/:id | 订单详情 |
| PUT | /api/orders/:id/cancel | 取消订单 |
| GET | /api/admin/products | 管理员-商品列表 |
| POST | /api/admin/products | 管理员-创建商品 |
| PUT | /api/admin/products/:id | 管理员-更新商品 |
| DELETE | /api/admin/products/:id | 管理员-删除商品 |
| GET | /api/admin/orders | 管理员-订单列表 |
| PUT | /api/admin/orders/:id/status | 管理员-更新订单状态 |
| GET | /api/admin/users | 管理员-用户列表 |
| PUT | /api/admin/users/:id/role | 管理员-更新用户角色 |
| DELETE | /api/admin/users/:id | 管理员-删除用户 |
| POST | /api/upload | 图片上传 |
| GET | /api/stats/overview | 数据概览 |
| GET | /api/stats/sales-daily | 日销量统计 |
| GET | /api/stats/category-stats | 分类统计 |
| GET | /api/stats/top-products | 热销商品 |
