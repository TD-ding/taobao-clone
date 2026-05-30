# 淘淘购物 (Taobao Clone)

一个仿淘宝的全栈电商网站，包含用户端商城、后端 RESTful API 和管理员后台。

## 简介

| 模块 | 功能 |
|------|------|
| 用户端 | 商品浏览 / 搜索 / 分类筛选 / 排序、商品收藏、购物车、下单、订单查看、商品评价、个人中心（编辑资料 / 收货地址管理）、注册登录 |
| 管理后台 | 数据看板（含销售趋势图）、商品增删改查（含多图 / 图片上传 / 上下架）、分类管理、订单管理（含搜索）、用户角色管理 |
| 后端 API | JWT 认证、商品 / 购物车 / 订单 / 收藏 / 评价 / 地址 CRUD、图片上传、数据统计、注册限流 |

管理员账号：`admin` / `admin123`

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18、React Router 6、Create React App |
| 后端 | Node.js、Express 4 |
| 数据库 | SQLite (better-sqlite3) |
| 认证 | JWT (jsonwebtoken + bcryptjs) |
| 文件上传 | Multer |
| 测试 | Jest + Supertest（后端）、React Testing Library（前端） |
| 部署 | Docker、GitHub Actions CI |

## 目录结构

```
taobao-clone/
├── .github/workflows/
│   └── ci.yml                        # GitHub Actions CI
├── Dockerfile                        # Docker 镜像构建
├── docker-compose.yml                # Docker Compose 编排
├── .dockerignore
├── docs/                             # 项目文档
│   ├── api.md                        # API 接口文档
│   ├── database.md                   # 数据库设计文档
│   ├── architecture.md               # 架构设计文档
│   └── deployment.md                 # 部署文档
├── server/                           # 后端
│   ├── server.js                     # Express 入口
│   ├── db.js                         # SQLite 连接（WAL 模式）
│   ├── init-db.js                    # 建表 & 种子数据
│   ├── init-db-cli.js                # 单独初始化入口
│   ├── .env.example                  # 环境变量模板
│   ├── tests/
│   │   └── api.test.js               # API 集成测试（40 用例）
│   ├── middleware/
│   │   └── auth.js                   # JWT 认证 / 管理员权限中间件
│   ├── routes/
│   │   ├── auth.js                   # 注册（含限流）/ 登录
│   │   ├── products.js               # 商品列表 / 详情 / 分类
│   │   ├── orders.js                 # 下单 / 查询 / 取消
│   │   ├── users.js                  # 购物车 CRUD
│   │   ├── profile.js                # 个人资料 / 地址 / 收藏 / 评价
│   │   ├── admin.js                  # 管理员：商品 / 分类 / 订单 / 用户
│   │   ├── upload.js                 # 图片上传
│   │   └── stats.js                  # 数据统计
│   └── uploads/                      # 上传文件目录
├── client/                           # 前端
│   └── src/
│       ├── App.js                    # 路由配置
│       ├── index.js                  # 入口
│       ├── setupTests.js             # Jest 测试配置
│       ├── context/
│       │   └── AuthContext.js        # 全局用户状态 + 购物车数量
│       ├── utils/
│       │   ├── api.js                # 请求封装（含 401 自动跳转）
│       │   └── format.js             # 价格 / 状态 / 时间格式化
│       ├── components/
│       │   ├── Navbar.js             # 顶部导航
│       │   └── Pagination.js         # 分页控件
│       ├── tests/
│       │   ├── format.test.js        # 工具函数测试
│       │   ├── Pagination.test.js    # 分页组件测试
│       │   └── NotFound.test.js      # 404 页面测试
│       ├── pages/                    # 用户端页面
│       │   ├── Home.js
│       │   ├── ProductDetail.js      # 含多图轮播、收藏、评价
│       │   ├── Cart.js               # 含地址选择
│       │   ├── Login.js
│       │   ├── Register.js
│       │   ├── Orders.js
│       │   ├── OrderDetail.js
│       │   ├── Profile.js            # 个人中心
│       │   ├── Favorites.js          # 我的收藏
│       │   └── NotFound.js           # 404 页面
│       ├── pages/admin/              # 管理后台页面
│       │   ├── AdminLayout.js
│       │   ├── Dashboard.js          # 含销售趋势折线图
│       │   ├── AdminProducts.js
│       │   ├── AdminCategories.js    # 分类管理
│       │   ├── AdminOrders.js        # 含搜索
│       │   └── AdminUsers.js
│       └── styles/
│           └── App.css
└── README.md
```

## 快速开始

### 本地开发

```bash
# 1. 安装依赖
cd server && npm install
cd ../client && npm install

# 2. 配置环境变量
cd server && cp .env.example .env
# 编辑 .env 设置 JWT_SECRET 和 CORS_ORIGIN

# 3. 初始化数据库（首次启动也会自动初始化）
cd server && npm run init-db

# 4. 启动
cd server && npm run dev    # 后端，端口 3001
cd client && npm start      # 前端，端口 3000
```

### Docker 部署

```bash
docker compose up -d
# 访问 http://localhost:3001
```

### 运行测试

```bash
cd server && npm test              # 后端测试（40 用例）
cd client && npm test              # 前端测试（交互模式）
cd client && npm run test:ci       # 前端测试（CI 模式 + 覆盖率）
```

### 访问地址

| 页面 | URL |
|------|-----|
| 商城首页 | http://localhost:3000 |
| 个人中心 | http://localhost:3000/profile |
| 我的收藏 | http://localhost:3000/favorites |
| 管理后台 | http://localhost:3000/admin |

## 详细文档

| 文档 | 说明 |
|------|------|
| [API 接口文档](docs/api.md) | 全部 RESTful API 端点说明 |
| [数据库设计](docs/database.md) | 表结构、字段、关系图 |
| [架构设计](docs/architecture.md) | 技术选型、关键设计决策、安全措施 |
| [部署文档](docs/deployment.md) | 本地开发、Docker 部署、CI/CD 配置 |
