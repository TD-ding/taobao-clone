# 数据库设计文档

## 概述

使用 SQLite（better-sqlite3），启用 WAL 模式和 FOREIGN KEY 约束。

数据库文件位置：`server/data/taobao.db`

## ER 关系图

```
users ──< orders ──< order_items >── products
  │                                      │
  ├──< cart_items >──────────────────────┘
  ├──< favorites >───────────────────────┘
  ├──< addresses                         │
  └──< reviews >─────────────────────────┘
                                          │
categories ──────────────────────────────┘
```

## 表结构

### users 用户表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 用户 ID |
| username | TEXT | UNIQUE, NOT NULL | 用户名 |
| password | TEXT | NOT NULL | bcrypt 哈希密码 |
| role | TEXT | DEFAULT 'customer', CHECK(customer/admin) | 角色 |
| email | TEXT | | 邮箱 |
| phone | TEXT | | 手机号 |
| avatar | TEXT | | 头像 URL |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 注册时间 |

### categories 分类表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 分类 ID |
| name | TEXT | NOT NULL | 分类名称 |
| icon | TEXT | | Emoji 图标 |
| sort_order | INTEGER | DEFAULT 0 | 排序权重 |

### products 商品表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 商品 ID |
| name | TEXT | NOT NULL | 商品名称 |
| description | TEXT | | 商品描述 |
| price | REAL | NOT NULL | 售价 |
| original_price | REAL | | 原价 |
| image | TEXT | | 主图 URL |
| images | TEXT | | 多图 JSON 数组 |
| category_id | INTEGER | FK → categories.id | 所属分类 |
| stock | INTEGER | DEFAULT 0 | 库存 |
| sales | INTEGER | DEFAULT 0 | 销量 |
| rating | REAL | DEFAULT 5.0 | 平均评分 |
| status | TEXT | DEFAULT 'active', CHECK(active/inactive) | 状态 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### orders 订单表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 订单 ID |
| user_id | INTEGER | NOT NULL, FK → users.id | 下单用户 |
| total_price | REAL | NOT NULL | 订单总额 |
| status | TEXT | DEFAULT 'pending', CHECK(pending/paid/shipped/delivered/cancelled) | 订单状态 |
| address | TEXT | | 收货地址 |
| phone | TEXT | | 联系电话 |
| note | TEXT | | 备注 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### order_items 订单项表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 订单项 ID |
| order_id | INTEGER | NOT NULL, FK → orders.id | 所属订单 |
| product_id | INTEGER | NOT NULL, FK → products.id | 商品 ID |
| quantity | INTEGER | NOT NULL | 数量 |
| price | REAL | NOT NULL | 下单时单价（快照） |
| product_name | TEXT | NOT NULL | 下单时商品名（快照） |
| product_image | TEXT | | 下单时商品图（快照） |

### cart_items 购物车表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 购物车项 ID |
| user_id | INTEGER | NOT NULL, FK → users.id | 用户 |
| product_id | INTEGER | NOT NULL, FK → products.id | 商品 |
| quantity | INTEGER | DEFAULT 1 | 数量 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 添加时间 |

### favorites 收藏表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 收藏 ID |
| user_id | INTEGER | NOT NULL, FK → users.id | 用户 |
| product_id | INTEGER | NOT NULL, FK → products.id | 商品 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 收藏时间 |

**唯一约束：** `(user_id, product_id)`

### addresses 收货地址表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 地址 ID |
| user_id | INTEGER | NOT NULL, FK → users.id | 用户 |
| name | TEXT | | 收货人姓名 |
| phone | TEXT | NOT NULL | 联系电话 |
| address | TEXT | NOT NULL | 详细地址 |
| is_default | INTEGER | DEFAULT 0 | 是否默认地址 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### reviews 评价表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO | 评价 ID |
| user_id | INTEGER | NOT NULL, FK → users.id | 评价用户 |
| product_id | INTEGER | NOT NULL, FK → products.id | 评价商品 |
| rating | INTEGER | NOT NULL, CHECK(1-5) | 评分 |
| content | TEXT | NOT NULL | 评价内容 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 评价时间 |

**唯一约束：** `(user_id, product_id)` — 每用户每商品限一条评价

## 种子数据

- 管理员账号：`admin` / `admin123`
- 8 个商品分类（手机数码、电脑办公、家用电器、服饰鞋包、美妆护肤、食品生鲜、图书文具、运动户外）
- 18 个示例商品
