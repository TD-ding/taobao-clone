# API 接口文档

基础路径：`/api`

## 通用说明

### 认证方式

需要认证的接口在请求头中携带 JWT Token：

```
Authorization: Bearer <token>
```

Token 通过注册或登录接口获取，有效期 7 天。

### 响应格式

成功：HTTP 2xx，返回 JSON 数据
失败：HTTP 4xx/5xx，返回 `{ "message": "错误信息" }`

### 分页参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | int | 1 | 页码（最小 1） |
| `limit` | int | 20 | 每页条数（1-100） |

分页响应包含 `page`、`totalPages` 字段。

---

## 认证 `/api/auth`

### POST /register

注册新用户（限流：同一 IP 每分钟最多 3 次）

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 至少 3 个字符 |
| password | string | 是 | 至少 6 个字符 |
| email | string | 否 | 邮箱 |
| phone | string | 否 | 手机号 |

**响应：** `{ token, user: { id, username, role, email, phone } }`

### POST /login

登录

**请求体：** `{ username, password }`

**响应：** `{ token, user: { id, username, role, email, phone, avatar } }`

### GET /me 🔒

获取当前用户信息

**响应：** `{ id, username, role, email, phone, avatar, created_at }`

---

## 商品 `/api/products`

### GET /

获取商品列表（公开）

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| keyword | string | 搜索关键词（模糊匹配商品名） |
| category_id | int | 按分类筛选 |
| min_price | float | 最低价格 |
| max_price | float | 最高价格 |
| sort | string | 排序：`sales` / `price_asc` / `price_desc` / `rating` |
| page | int | 页码 |
| limit | int | 每页条数 |

**响应：** `{ products: [...], total, page, totalPages }`

### GET /categories

获取所有分类（公开）

**响应：** `[{ id, name, icon, sort_order }]`

### GET /:id

获取商品详情（公开）

**响应：** 商品完整信息，含 `category_name`

---

## 购物车 `/api/users` 🔒

所有接口需要登录。

### GET /cart

获取购物车列表

**响应：** `[{ id, product_id, quantity, product_name, price, image, stock, product_status, created_at }]`

### POST /cart

添加商品到购物车（已存在则累加数量）

**请求体：** `{ product_id, quantity? }`

### PUT /cart/:id

修改购物车商品数量

**请求体：** `{ quantity }`

### DELETE /cart/:id

移除购物车商品

### DELETE /cart

清空购物车

---

## 订单 `/api/orders` 🔒

### POST /

创建订单（事务：检查库存 → 扣减库存 → 删除购物车项）

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| items | array | 是 | `[{ product_id, quantity }]` |
| address | string | 是 | 收货地址 |
| phone | string | 是 | 联系电话 |
| note | string | 否 | 备注 |

**响应：** `{ message, orderId }`

### GET /

获取当前用户订单列表

**查询参数：** `status`（筛选状态）、`page`、`limit`

**响应：** `{ orders: [{ ...order, items: [...] }], total, page, totalPages }`

### GET /:id

获取订单详情

### PUT /:id/cancel

取消订单（仅 `pending` 状态可取消，自动恢复库存）

---

## 个人中心 `/api/profile`

### GET /reviews/:product_id

获取商品评价（公开，无需认证）

**响应：** `[{ id, user_id, username, avatar, rating, content, created_at }]`

### 以下接口需要登录 🔒

### GET /profile

获取个人资料

### PUT /profile

更新个人资料

**请求体：** `{ email?, phone?, avatar? }`

### GET /addresses

获取收货地址列表

### POST /addresses

新增收货地址

**请求体：** `{ name?, phone, address, is_default? }`

### PUT /addresses/:id

编辑收货地址

### DELETE /addresses/:id

删除收货地址

### GET /favorites

获取收藏列表

**响应：** 商品完整信息数组

### POST /favorites

添加收藏

**请求体：** `{ product_id }`

### DELETE /favorites/:product_id

取消收藏

### GET /favorites/check/:product_id

检查是否已收藏

**响应：** `{ favorited: boolean }`

### POST /reviews

发表评价（每个用户每个商品限一条，自动更新商品均分）

**请求体：** `{ product_id, rating(1-5), content }`

---

## 管理后台 `/api/admin` 🔒👑

所有接口需要管理员权限。

### 商品管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /products | 商品列表（支持 `keyword`、`status` 筛选） |
| POST | /products | 创建商品 |
| PUT | /products/:id | 更新商品（只更新传入的字段，空字符串置为 null） |
| DELETE | /products/:id | 删除商品（级联删除购物车项、收藏、评价、订单项） |

**商品字段：** name, description, price, original_price, image, images, category_id, stock, status(active/inactive)

### 分类管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /categories | 分类列表 |
| POST | /categories | 创建分类 |
| PUT | /categories/:id | 更新分类 |
| DELETE | /categories/:id | 删除分类（关联商品置为未分类） |

**分类字段：** name, icon, sort_order

### 订单管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /orders | 订单列表（支持 `status`、`keyword` 搜索订单号/用户名） |
| PUT | /orders/:id/status | 更新订单状态 |

**状态流转规则：**

```
pending → paid / cancelled
paid → shipped / cancelled
shipped → delivered
delivered → （终态）
cancelled → （终态）
```

取消订单时自动恢复库存和销量。

### 用户管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /users | 用户列表（���持 `keyword` 搜索用户名/邮箱） |
| PUT | /users/:id/role | 修改用户角色（customer ↔ admin） |
| DELETE | /users/:id | 删除用户（级联删除订单项→订单→购物车→收藏→地址→评价→用户） |

---

## 图片上传 `/api/upload` 🔒👑

### POST /

上传图片（仅管理员，5MB 限制，支持 jpg/png/gif/webp）

**请求：** `multipart/form-data`，字段名 `image`

**响应：** `{ url: "/uploads/xxx.jpg" }`

---

## 数据统计 `/api/stats` 🔒👑

### GET /overview

数据概览：商品数、用户数、订单数、营收、待处理、配送中

### GET /sales-daily?days=7

每日销售统计

### GET /category-stats

分类销量排行

### GET /top-products?limit=10

热销商品排行
