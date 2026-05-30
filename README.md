# 淘淘购物 (Taobao Clone)

一个仿淘宝的全栈电商网站，包含用户端商城、后端 RESTful API 和管理员后台。

## 简介

| 模块 | 功能 |
|------|------|
| 用户端 | 商品浏览 / 搜索 / 分类筛选 / 排序、购物车、下单、订单查看、注册登录 |
| 管理后台 | 数据看板、商品增删改查（含图片上传 / 上下架）、订单状态管理、用户角色管理 |
| 后端 API | JWT 认证、商品 / 购物车 / 订单 CRUD、图片上传、数据统计、注册限流 |

管理员账号：`admin` / `admin123`

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18、React Router 6、Create React App |
| 后端 | Node.js、Express 4 |
| 数据库 | SQLite (better-sqlite3) |
| 认证 | JWT (jsonwebtoken + bcryptjs) |
| 文件上传 | Multer |

## 目录结构

```
taobao-clone/
├── server/                         # 后端
│   ├── server.js                   # Express 入口（含自动初始化数据���）
│   ├── db.js                       # SQLite 连接
│   ├── init-db.js                  # 建表 & 种子数据（可被 require）
│   ├── init-db-cli.js              # 单独运行初始化的入口
│   ├── .env.example                # 环境变量模板
│   ├── middleware/
│   │   └── auth.js                 # JWT 认证 / 管理员权限中间件
│   ├── routes/
│   │   ├── auth.js                 # 注册（含限流）/ 登录
│   │   ├── products.js             # 商品列表 / 详情 / 分类（含分页校验）
│   │   ├── orders.js               # 下单 / 查询 / 取消
│   │   ├─��� users.js                # 购物车 CRUD
│   │   ├── admin.js                # 管理员：商品 / 订单 / 用户
│   │   ├── upload.js               # 图片上传（crypto 随机文件名）
│   │   └── stats.js                # 统计概览 / 排行
│   └── uploads/                    # 上传文件目录
├── client/                         # 前端
│   └── src/
│       ├── App.js                  # 路由配置
│       ├── context/
│       │   └── AuthContext.js      # 全局用户状态
│       ├── utils/
│       │   ├── api.js              # 请求封装（含 401 自动跳转）
│       │   └── format.js           # 价格格式化 / 状态映射 / 时间格式化
│       ├── components/
│       │   ├── Navbar.js           # 顶部导航（含购物车数量、移动端折叠菜单）
│       │   └── Pagination.js       # 分页
│       ├── pages/                  # 用户端页面
│       │   ├── Home.js
│       │   ├── ProductDetail.js
│       │   ├── Cart.js
│       │   ├── Login.js
│       │   ├── Register.js
│       │   ├── Orders.js
│       │   └── OrderDetail.js
│       ├── pages/admin/            # 管理后台页面
│       │   ├── AdminLayout.js
│       │   ├── Dashboard.js
│       │   ├── AdminProducts.js
│       │   ├── AdminOrders.js
│       │   └── AdminUsers.js
│       └── styles/
│           └── App.css
└── README.md
```

## 如何运行

### 1. 安装依赖

```bash
# 后端
cd server && npm install

# 前端
cd ../client && npm install
```

### 2. 配置环境变量

```bash
cd server
cp .env.example .env
# 编辑 .env 设置 JWT_SECRET 和 CORS_ORIGIN
```

### 3. 初始化数据库

```bash
cd server && npm run init-db
```

> 首次启动后端时也会自动初始化数据库。

### 4. 启动

```bash
# 后端（端口 3001）
cd server && npm run dev

# 前端（端口 3000，开发代理已指向后端）
cd client && npm start
```

### 5. 访问

- 商城首页：http://localhost:3000
- 管理后台：http://localhost:3000/admin
