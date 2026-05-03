# u-nest-api-starter

> AI 友好的 TypeScript API 底座 — NestJS + Prisma + PostgreSQL。

后续承载:公益救援队内部管理系统、U Studio 内部系统、客户项目二开、各类小程序后台。

---

## 必读文档(改代码前请先读)

| 文档 | 作用 |
|---|---|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | v1 蓝图,数据模型 / 接口清单 / 命名铁律 / 升级路径,**所有规则的唯一来源** |
| [`CLAUDE.md`](./CLAUDE.md) | Claude Code 协作铁律(从 ARCHITECTURE.md §7 抽取) |
| [`AGENTS.md`](./AGENTS.md) | 通用 AI Agent 协作铁律(与 CLAUDE.md 内容同步) |

冲突时**以 `ARCHITECTURE.md` 为准**。除非用户明确要求,AI 不得修改 `ARCHITECTURE.md`。

---

## 环境要求

- **Node.js** ≥ 22 LTS
- **pnpm** 10.14.0(已在 `package.json#packageManager` 钉版本,**禁止使用 npm / yarn / bun**)
- **Docker**(只用来跑本地 PostgreSQL,不构建应用镜像)

---

## 快速启动

```bash
# 1. 复制 env 模板
cp .env.example .env

# 2. 起 PostgreSQL 容器(只起 DB,应用本身跑在宿主机)
docker compose up -d

# 3. 安装依赖
pnpm install

# 4. 应用 Prisma migration(首次会自动 generate Prisma Client)
pnpm prisma:migrate

# 5. 写入默认 super admin
pnpm prisma:seed

# 6. 启动开发服务(watch 模式)
pnpm start:dev
```

服务起来后,浏览器打开:

> http://localhost:3000/api/docs

即可看到 Swagger UI,在线调试所有接口。

---

## 默认账号

| 字段 | 值 |
|---|---|
| username | `admin` |
| password | `ChangeMe123456` |
| role | `SUPER_ADMIN` |

**⚠ 仅供本地开发使用。**生产部署前必须修改:
- `.env` 中的 `SUPER_ADMIN_USERNAME`(production 下禁止 `admin`)
- `.env` 中的 `SUPER_ADMIN_PASSWORD`(production 下禁止默认值)
- `.env` 中的 `JWT_SECRET`(必须 ≥ 32 字符,production 下禁止默认值;推荐 `openssl rand -base64 48`)
- `.env` 中的 `APP_CORS_ORIGIN`(production 下禁止为空,禁止 `*`)

启动时会做强校验,任一不满足直接抛错退出。

---

## 项目结构

```
.
├── ARCHITECTURE.md           # v1 蓝图(详版结构见 §3)
├── CLAUDE.md / AGENTS.md     # AI 协作铁律
├── docker-compose.yml        # 本地 PostgreSQL
├── prisma/
│   ├── schema.prisma         # 数据模型(User + Role + UserStatus)
│   ├── migrations/           # 自动生成的迁移文件
│   └── seed.ts               # 默认 super admin 种子
└── src/
    ├── main.ts               # 应用入口(全局 prefix /api、CORS、Pipe、Filter、Interceptor、Swagger)
    ├── app.module.ts
    ├── config/               # app / database / jwt 三份 config
    ├── common/               # 公共基础件:decorators / dto / exceptions / filters / guards / interceptors / storage(占位)
    ├── database/             # PrismaService + DatabaseModule
    └── modules/
        ├── health/           # GET /api/health
        ├── auth/             # POST /api/auth/login
        ├── users/            # 9 个用户接口
        └── ai/               # README.md 占位,v1 不实现
```

---

## 路由总览

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| `GET` | `/api/health` | 公开 | 服务健康检查(向后兼容) |
| `GET` | `/api/health/live` | 公开 | K8s liveness — 进程存活 |
| `GET` | `/api/health/ready` | 公开 | K8s readiness — DB 连通(失败时 HTTP 500 + `code: 50000`,详见 `ARCHITECTURE.md` §11.4) |
| `POST` | `/api/auth/login` | 公开 | `username + password` 登录,返回 JWT;**默认 IP 维度限流 5 次 / 60 秒**(内存 storage) |
| `GET` | `/api/users/me` | 登录 | 获取本人资料 |
| `PATCH` | `/api/users/me` | 登录 | 修改本人非敏感资料(昵称、头像 key) |
| `GET` | `/api/users` | super admin / admin | 用户列表(分页) |
| `POST` | `/api/users` | super admin / admin | 创建用户 |
| `GET` | `/api/users/:id` | super admin / admin | 用户详情 |
| `PATCH` | `/api/users/:id` | super admin / admin | 修改用户资料 |
| `PUT` | `/api/users/:id/password` | super admin / admin | 重置用户密码 |
| `PATCH` | `/api/users/:id/role` | **super admin only** | 修改用户角色 |
| `PATCH` | `/api/users/:id/status` | super admin / admin | 启用/禁用用户 |
| `DELETE` | `/api/users/:id` | super admin / admin | 软删除用户 |
| `GET` | `/api/docs` | 开发环境默认开启 | Swagger UI(生产需 `ENABLE_SWAGGER=true`) |

详见 `ARCHITECTURE.md` §6。

---

## 认证示例

```bash
# 1. 登录拿 token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"ChangeMe123456"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# 2. 用 token 访问受保护接口
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/users/me
```

成功响应统一为 `{ "code": 0, "message": "ok", "data": ... }`,错误响应为 `{ "code": <BizCode>, "message": <提示>, "data": null }`。详见 `ARCHITECTURE.md` §7.3。

---

## 常用命令

```bash
# 开发
pnpm start:dev         # watch 模式启动
pnpm start             # 一次性启动
pnpm build             # 编译到 dist/
pnpm start:prod        # 跑编译后的产物

# 代码质量
pnpm lint              # ESLint
pnpm typecheck         # tsc --noEmit
pnpm format            # prettier --write

# Prisma
pnpm prisma:migrate    # 应用 migration(开发态,会触发 generate)
pnpm prisma:generate   # 仅重新生成 Prisma Client
pnpm prisma:seed       # 写入默认 super admin(幂等;已存在时不覆盖)
pnpm prisma:studio     # 图形化数据库 GUI(http://localhost:5555)

# E2E 测试
pnpm db:test:init      # 在 Postgres 容器里幂等创建 app_test 测试库(首次跑测试前执行一次)
pnpm test:e2e          # 跑全部 E2E(自动 load .env.test → migrate deploy → 串行执行)
pnpm test:e2e:watch    # watch 模式
pnpm db:test:reset     # 出现脏数据时重置 app_test(护栏:DATABASE_URL 不含 'app_test' 拒绝执行)
```

---

## E2E 测试

E2E 跑在独立的 `app_test` 物理库,与开发库 `app` 完全隔离,**不污染开发数据**。配置由 [`.env.test`](./.env.test) 驱动,Jest globalSetup 与 setupFiles 双层加载并强制 `override: true`,防止 shell 中已 export 的 `DATABASE_URL` 误打开发库。

当前覆盖 **19 spec / 162 用例**,本机 macOS 双跑 ~16s,串行执行(`--runInBand`),`detectOpenHandles: true` 启用,无连接泄漏。

```bash
# 1. 起 PostgreSQL 容器(若尚未起)
docker compose up -d

# 2. 首次跑测试前,创建 app_test 库(幂等,已存在则跳过)
pnpm db:test:init

# 3. 跑 E2E
pnpm test:e2e
```

任何破坏性操作(`TRUNCATE`、`prisma migrate deploy`、`prisma migrate reset`)在执行前都会断言 `DATABASE_URL` 包含 `app_test` 子串,不通过立即抛错。详见 [`test/setup/test-db.ts`](./test/setup/test-db.ts)。

### 覆盖范围一览

| spec 文件 | 覆盖内容 |
|---|---|
| [`health`](./test/e2e/health.e2e-spec.ts) | 健康检查响应包装 |
| [`response-format`](./test/e2e/response-format.e2e-spec.ts) / [`swagger`](./test/e2e/swagger.e2e-spec.ts) / [`bizcode-http-status`](./test/e2e/bizcode-http-status.e2e-spec.ts) | 横切:统一响应格式 / Swagger 跳过包装 / BizCode httpStatus 一致性 |
| [`auth-login`](./test/e2e/auth-login.e2e-spec.ts) / [`auth-jwt-guard`](./test/e2e/auth-jwt-guard.e2e-spec.ts) | 登录正反路径(含防账号枚举四场景一致性)+ JWT 鉴权失效全部分支 |
| [`users-me`](./test/e2e/users-me.e2e-spec.ts) | 本人接口 GET /me、PATCH /me(字段白名单 + 长度边界) |
| [`users-admin-list`](./test/e2e/users-admin-list.e2e-spec.ts) / [`users-admin-crud`](./test/e2e/users-admin-crud.e2e-spec.ts) / [`users-role-boundary`](./test/e2e/users-role-boundary.e2e-spec.ts) | 管理接口分页 / CRUD 基础路径 / 跨角色边界 |
| [`users-self-protection`](./test/e2e/users-self-protection.e2e-spec.ts) / [`users-last-super-admin`](./test/e2e/users-last-super-admin.e2e-spec.ts) / [`users-soft-delete`](./test/e2e/users-soft-delete.e2e-spec.ts) / [`users-password-reset`](./test/e2e/users-password-reset.e2e-spec.ts) | 自我保护 / SUPER_ADMIN 互操作正向回归 / 软删副作用矩阵 / 密码重置完整流程(含 §9 token 不主动吊销反向断言) |
| [`seed`](./test/e2e/seed.e2e-spec.ts) | `prisma/seed.ts` 子进程行为 + production 强校验 |

---

## 环境变量

完整字段与默认值见 [`.env.example`](./.env.example)。**v1 阶段已落地的字段**:

| 字段 | 用途 | 阶段 |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 连接串(Prisma CLI 自动读取) | 第 3 阶段 |
| `APP_PORT` / `APP_ENV` / `APP_CORS_ORIGIN` / `ENABLE_SWAGGER` | 应用层运行参数 | 第 4 阶段 |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | JWT 签发参数 | 第 7 阶段 |
| `SUPER_ADMIN_USERNAME` / `SUPER_ADMIN_PASSWORD` / `SUPER_ADMIN_EMAIL` | seed 默认账号 | 第 9 阶段 |
| `LOG_LEVEL` | pino 日志级别(`fatal`/`error`/`warn`/`info`/`debug`/`trace`),留空时按 `APP_ENV` 自动推断 | V1.1 §15.2 |
| `LOGIN_THROTTLE_LIMIT` / `LOGIN_THROTTLE_TTL_SECONDS` | 登录接口 IP 维度限流参数,留空默认 `5` / `60` | V1.1 §15.7 |

环境变量字段以 [`.env.example`](./.env.example) 为唯一来源。启动强校验细则见 `ARCHITECTURE.md` §8 / §11.5 + `CLAUDE.md` §14 / §17。

---

## V1.1 工程加固已落地能力

V1.1 在 v1 业务接口与数据模型不变的前提下,补齐了基础工程能力。规范定义见 `ARCHITECTURE.md` §11、`AGENTS.md` §17、`CLAUDE.md` §17;任务清单与验收标准见 [`TASKS.md`](./TASKS.md)。

| 能力 | 说明 |
|---|---|
| GitHub Actions CI | 每次 push / PR 自动跑 `lint` + `typecheck` + `pnpm test:e2e`(基于 docker-compose 启动 `postgres:16-alpine`),守住回归 |
| 结构化日志 | `nestjs-pino` 输出 JSON,生产 stdout 直出;非生产由 `pino-pretty` 美化(`pino-pretty` 是 dev 依赖,生产镜像 runner 阶段不包含)。敏感字段(`password` / `newPassword` / `passwordHash` / `authorization` / `cookie` / `token` / `accessToken` / `refreshToken` / `secret`)在日志中显示为 `[REDACTED]` |
| 请求 ID `x-request-id` | 客户端可传入沿用,缺失时由 `cuid()` 生成;同时回写响应头并自动出现在每条日志的 `reqId` 字段中(不写入响应体、不进 JWT payload) |
| 优雅关闭 | `app.enableShutdownHooks()` + `PrismaService.onModuleDestroy()`,SIGTERM / SIGINT 时等待 in-flight 请求并干净断开 Prisma 连接 |
| 健康检查分层 | `GET /api/health`(向后兼容)/ `GET /api/health/live`(进程存活)/ `GET /api/health/ready`(基于 `@nestjs/terminus` 的 DB 连通探测);三端点均走统一响应包装 |
| helmet HTTP 安全头 | 默认开启 helmet,响应头含 `X-Content-Type-Options` / `X-Frame-Options` / `Strict-Transport-Security` 等基线项;Swagger UI 路径 `/api/docs` 局部禁用 CSP 以保留交互能力 |
| 登录接口限流 | `POST /api/auth/login` 走 `@nestjs/throttler` 内存 storage,默认 IP 维度 5 次 / 60 秒,可经 `LOGIN_THROTTLE_LIMIT` / `LOGIN_THROTTLE_TTL_SECONDS` 调整。命中后返回 HTTP 429 + `{ code: 42900, message: "请求过于频繁，请稍后再试", data: null }`,**不在响应体或响应头中暴露阈值、剩余配额、重置时间**(包括 `Retry-After`) |
| Dockerfile 多阶段构建 | `deps` → `builder` → `runner` 三阶段,基于 `node:22-alpine`,以非 root 用户(`uid=1000 node`)运行;镜像内不包含 `.env*` / `.git` / `test/` / `.planning/` / 项目协作文档(由 [`.dockerignore`](./.dockerignore) 保证) |

V1.1 **没有**做的事(沿用 `ARCHITECTURE.md` §9 升级条件):未引入 Redis / BullMQ / 队列;未接入 OpenTelemetry / Sentry / APM / Prometheus;未实现 RBAC / refresh token / 多租户 / 文件上传 Provider / LLM;未持久化审计日志;未交付 `docker-compose.prod.yml` / K8s manifests / 镜像推送脚本。

---

## Docker 镜像

V1.1 仅交付应用镜像本身;`docker-compose.yml` 仅供本地起 PostgreSQL 不变,生产部署形态由部署环境决定。

### 构建

```bash
docker build -t u-nest-api-starter:v1.1 .
```

### 运行(最小示例)

生产镜像面向 `APP_ENV=production` 运行:runner 阶段已裁掉 devDependencies(包括 `pino-pretty`),因此若以 `APP_ENV=development` 启动,会在初始化日志模块时因加载不到 `pino-pretty` 而启动失败。生产部署使用下面的 production 配置:

```bash
docker run --rm -p 3000:3000 \
  -e APP_PORT=3000 \
  -e APP_ENV=production \
  -e DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/app?schema=public' \
  -e JWT_SECRET="$(openssl rand -base64 48)" \
  -e JWT_EXPIRES_IN=7d \
  -e APP_CORS_ORIGIN=https://app.example.com \
  -e ENABLE_SWAGGER=false \
  u-nest-api-starter:v1.1
```

启动强校验在 `APP_ENV=production` 下会拒绝:`JWT_SECRET` 等于 `.env.example` 默认值、`APP_CORS_ORIGIN` 为空或 `*`、`SUPER_ADMIN_PASSWORD` 等于默认值(seed 时)、`SUPER_ADMIN_USERNAME=admin`(seed 时)。完整字段以 [`.env.example`](./.env.example) 为准。

### 生产数据库迁移原则

- 生产环境**只允许** `prisma migrate deploy`(已审查、已提交的 migration);**禁止** `prisma migrate dev`
- 应用容器**不会**在启动时自动执行 migration:Dockerfile 中没有 entrypoint 触发 `migrate deploy`,`CMD` 只跑 `node dist/main.js`
- migration 必须由部署流程**显式**触发(CI/CD pipeline 独立步骤、K8s `Job` / `initContainer` / Helm pre-upgrade hook、平台一次性 migration job 等),并在应用副本启动**之前**完成
- 不在容器启动时自动 migrate 的原因:连库失败会触发反复重启(K8s rollback 行为不可控);多副本同时启动会让多个 `migrate deploy` 并发,Prisma migration_lock 不保证安全。详见 [`Dockerfile`](./Dockerfile) 文末注释

---

## 排错

- **启动时抛 `JWT_SECRET 长度不足` / `APP_CORS_ORIGIN 不能为空`**:`.env` 缺字段或值不符合启动强校验,按提示修。
- **`pnpm prisma:migrate` 报连接错误**:确认 `docker compose ps` 中 `u-nest-api-postgres` 已 `healthy`。
- **`/api/docs` 返回 404**:检查 `APP_ENV` 与 `ENABLE_SWAGGER`,生产环境必须显式 `ENABLE_SWAGGER=true` 才注册 Swagger。
- **`pnpm prisma:seed` 提示 `already exists; skipping`**:这是预期行为(seed 幂等,不会覆盖已存在用户)。
