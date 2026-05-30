# 部署文档

## 本地开发

### 1. 安装依赖

```bash
cd server && npm install
cd ../client && npm install
```

### 2. 配置环境变量

```bash
cd server
cp .env.example .env
```

编辑 `.env`：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 3001 | 服务端口 |
| `JWT_SECRET` | — | JWT 签名密钥（生产环境务必更换） |
| `CORS_ORIGIN` | http://localhost:3000 | 允许的前端来源（多个用逗号分隔） |

### 3. 初始化数据库

```bash
cd server && npm run init-db
```

首次启动服务时也会自动初始化（检测 `data/taobao.db` 是否存在）。

### 4. 启动服务

```bash
# 后端（端口 3001）
cd server && npm run dev

# 前端（端口 3000，开发代理指向后端）
cd client && npm start
```

### 5. 访问

| 页面 | URL |
|------|-----|
| 商城首页 | http://localhost:3000 |
| 个人中心 | http://localhost:3000/profile |
| 我的收藏 | http://localhost:3000/favorites |
| 管理后台 | http://localhost:3000/admin |

管理员账号：`admin` / `admin123`

---

## Docker 部署

### 构建并启动

```bash
docker compose up -d
```

### 配置

环境变量可在 `docker-compose.yml` 中修改：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 3001 | 服务端口 |
| `JWT_SECRET` | change_this_in_production | JWT 密钥（生产环境务必更换） |
| `CORS_ORIGIN` | http://localhost:3000 | 前端来源 |

数据持久化通过 Docker volumes：

- `db-data` → `/app/server/data` — SQLite 数据库文件
- `uploads` → `/app/server/uploads` — 上传图片文件

### 常用命令

```bash
# 查看日志
docker compose logs -f

# 停止
docker compose down

# 重建（代码变更后）
docker compose up -d --build
```

---

## 生产部署注意事项

1. **JWT_SECRET** — 必须设置为足够长的随机字符串，切勿使用默认值
2. **CORS_ORIGIN** — 只允许实际部署的前端域名
3. **数据库备份** — 定期备份 `server/data/taobao.db` 文件（SQLite 直接复制即可）
4. **反向代理** — 建议在 Docker 前加一层 Nginx/Caddy 处理 HTTPS 和静态文件缓存
5. **静态文件** — 前端构建产物已在 Docker 镜像中，由 Express 通过 `/uploads` 提供静态资源；若需单独部署前端，可将 `client/build/` 目录放到 CDN

---

## CI/CD

项目配置了 GitHub Actions（`.github/workflows/ci.yml`），在 push 到 `main` 或 `agent/dev` 分支以及 PR 到 `main` 时触发：

**三个 Job：**

1. `server-test` — 安装后端依赖 → 运行 `npm test`（40 个 API 测试用例）
2. `client-test` — 安装前端依赖 → 运行 `npm run test:ci`（14 个前端测试 + 覆盖率） → `npm run build`（构建验证）
3. `docker-build` — 构建 Docker 镜像（仅在测试通过后执行）

### 测试命令

```bash
# 后端测试
cd server && npm test

# 前端测试（交互模式）
cd client && npm test

# 前端测试（CI 模式，无交互 + 覆盖率报告）
cd client && npm run test:ci
```