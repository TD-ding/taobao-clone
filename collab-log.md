# 淘淘购物 — 协作开发日志

## 项目信息

- **项目名称**：淘淘购物（Taobao Clone）
- **仓库地址**：https://github.com/TD-ding/taobao-clone
- **开发分支**：`agent/dev`
- **开发周期**：5 轮迭代 + 基础设施配置 + 文档编写

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18、React Router 6、Create React App |
| 后端 | Node.js、Express 4 |
| 数据库 | SQLite (better-sqlite3, WAL 模式) |
| 认证 | JWT (jsonwebtoken + bcryptjs) |
| 文件上传 | Multer (crypto 随机文件名) |
| 测试 | Jest + Supertest（后端 40 用例）、React Testing Library（前端 14 用例） |
| 部署 | Docker、docker-compose、GitHub Actions CI |

---

## 迭代记录

### 第 0 轮：项目初始化

**提交**：`94e536d` feat: implement full-stack taobao clone

**主要内容**：
- 完成全栈电商网站初始版本
- 前端：React 18 + React Router 6，含首页、商品详情、购物车、下单、订单、登录注册、管理后台（Dashboard / 商品 / 订单 / 用户）
- 后端：Express 4 + SQLite，RESTful API，JWT 认证，图片上传，数据统计
- 数据库：用户、分类、商品、订单、订单项、购物车 6 张表 + 种子数据
- README.md 初版

---

### 第 1 轮：安全加固与代码质量

**提交**：`57a1af5` fix: security hardening and code quality improvements

**反馈主题**：安全漏洞、代码质量、数据完整性

**主要改动**：
- JWT 密钥从硬编码改为 `process.env.JWT_SECRET`，新增 `.env.example`
- 注册接口添加 IP 限流（内存 Map，每分钟 3 次）
- 图片上传使用 `crypto.randomBytes(16)` 生成随机文件名
- 搜索接口添加 `escapeLike()` 防止 LIKE 通配符注入
- 订单创建移入数据库事务
- 批量查询订单项替代 N+1 查询
- 商品价格验证不允许负数
- 删除用户时级联删除订单项→订单→购物车
- `server/data/*.db` 加入 `.gitignore`
- 前端 AuthContext 改用 api 工具函数
- 统一 ¥ 符号显示，提取 STATUS_MAP 到 format.js
- 管理后台 401 自动跳转登录
- 购物车添加库存上限检查
- 搜索添加 400ms 防抖
- 服务启动时自动初始化数据库
- CORS 限制为可配置 Origin

---

### 第 2 轮：安全增强与用户体验

**提交**：`7b5ef4d` fix: round-2 improvements for security, UX, and data integrity

**反馈主题**：内存泄漏、代码复用、UX 细节

**主要改动**：
- 注册限流 Map 添加 5 分钟定时清理（`setInterval`），防止内存泄漏
- 提取 `escapeLike` / `sanitizePagination` 到 products.js 并复用
- 分页参数边界校验（page ≥ 1, limit ∈ [1, maxLimit]）
- 统计接口合并为单个复合 SELECT 查询
- 商品更新支持显式字段列表，可清空字段
- 删除用户时处理订单项级联
- 购物车角标数量实时更新（AuthContext 添加 cartCount + refreshCartCount）
- 搜索框同步（Navbar 和 Home 统一使用 URL 参数 + 防抖）
- 按钮添加 loading 状态
- 已下架商品不可加购（前端禁用 + 后端校验）
- 取消订单后重新获取数据
- 管理后台添加加载态避免权限闪烁
- 移动端导航添加汉堡菜单
- 页面标题改为"淘淘购物"
- 时间格式化为中文（年月日）

---

### 第 3 轮：UX 改进与 Bug 修复

**提交**：`33a5a89` fix: round 3 UX improvements and bug fixes

**反馈主题**：交互体验、显示问题、缺失功能

**主要改动**：
- 购物车角标添加商品后自动更新（refreshCartCount 全局调用）
- 结算金额排除已下架商品（activeTotal）
- 弹窗支持 ESC 键关闭
- 管理后台搜索框添加 400ms 防抖（AdminProducts、AdminUsers、AdminOrders）
- 移除 CSS `::before` 双重 ¥ 符号，统一使用 formatPrice()
- 商品详情页添加返回按钮
- 订单详情页添加取消订单按钮
- 新增 404 页面（NotFound.js）+ 路由兜底
- 商品售罄显示明显提示文字
- 商品卡片仅库存 ≤ 10 时提示"仅剩 X 件"，移除库存数量显示
- 管理后台修改订单状态添加确认弹窗
- 分页添加首页/末页快捷跳转 + 省略号

---

### 第 4 轮：功能增强

**提交**：`9a67122` feat: add profile, favorites, reviews, categories management, sales chart, multi-image, and address saving

**反馈主题**：新功能需求

**主要改动**：
- **个人中心**：Profile.js，支持编辑邮箱/手机/头像，收货地址 CRUD
- **商品收藏**：Favorites.js + 详情页收藏按钮，后端 favorites 表 + CRUD 接口
- **商品评价**：1-5 星评分 + 文字评价，公开可见，自动更新商品均分，reviews 表
- **分类管理**：AdminCategories.js，后端分类 CRUD + 删除时商品置为未分类
- **订单搜索**：管理后台支持按订单号/用户名搜索
- **多图轮播**：ProductDetail 解析 images JSON 字段，缩略图切换
- **地址选择**：结算时选择已保存地址，自动填充
- **销售趋势图**：Dashboard 调用 /stats/sales-daily，7/14/30 天切换
- 新增数据库表：favorites、addresses、reviews
- 新增 server/routes/profile.js（profile + addresses + favorites + reviews）
- 更新 README

---

### 第 5 轮：Bug 修复与数据完整性

**提交**：`37df3af` fix: round 5 bug fixes and data integrity improvements

**反馈主题**：运行时 Bug、并发安全、状态校验

**主要改动**：
- 修复删除商品报错：级联删除 cart_items、favorites、reviews、order_items
- 修复管理后台搜索订单报错：CAST(o.id AS TEXT) 修复整数列 LIKE 查询
- 商品评价改为公开访问（无需登录即可查看）
- 购物车数量操作改为乐观更新（先更新 UI 再发请求）
- 收藏页加购后更新导航栏角标
- 订单状态添加流转校验（不可回退，如已发货不可改回待付款）
- 管理后台取消订单时恢复库存
- 下单库存检查和扣减移入同一事务，保证原子性
- 修复 admin 订单搜索 count 查询缺少 JOIN

---

### 基础设施配置

**提交**：`876fbe8` feat: add unit tests, Docker, and CI configuration

**主要内容**：
- 后端测试：Jest + Supertest，40 个 API 集成测试用例，覆盖 auth / products / cart / orders / admin / stats / profile / 工具函数
- 前端测试：React Testing Library，14 个用例，覆盖 format 工具函数 / Pagination 组件 / NotFound 页面
- Dockerfile：Node 18 Alpine，客户端构建 + 服务端运行
- docker-compose.yml：端口映射、环境变量、数据卷持久化
- GitHub Actions CI（`.github/workflows/ci.yml`）：server-test → client-test+build → docker-build 三阶段流水线

---

### 文档编写

**提交**：`3cb9fef` docs: add project documentation and calibrate README

**主要内容**：
- `docs/api.md` — 完整 API 接口文档（所有端点、参数、响应格式、认证要求）
- `docs/database.md` — 数据库设计文档（9 张表结构、ER 关系图、种子数据）
- `docs/architecture.md` — 架构设计文档（技术选型、关键设计决策、前端架构、安全措施）
- `docs/deployment.md` — 部署文档（本地开发、Docker 部署、生产注意事项、CI/CD）
- README.md 校准：准确的目录结构、快速开始、文档链接

---

## 测试覆盖

| 模块 | 框架 | 用例数 | 覆盖范围 |
|------|------|--------|----------|
| server | Jest + Supertest | 40 | auth / products / cart / orders / admin / stats / profile / utils |
| client | React Testing Library | 14 | format / Pagination / NotFound |

## 提交历史

| 提交 | 类型 | 说明 |
|------|------|------|
| `94e536d` | feat | 全栈项目初始版本 |
| `ebaf34f` | docs | README 初版 |
| `57a1af5` | fix | 第 1 轮：安全加固与代码质量 |
| `7b5ef4d` | fix | 第 2 轮：安全增强与用户体验 |
| `33a5a89` | fix | 第 3 轮：UX 改进与 Bug 修复 |
| `9a67122` | feat | 第 4 轮：功能增强 |
| `37df3af` | fix | 第 5 轮：Bug 修复与数据完整性 |
| `876fbe8` | feat | 单元测试、Docker、CI 配置 |
| `3cb9fef` | docs | 项目文档与 README 校准 |
