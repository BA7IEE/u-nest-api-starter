# u-nest-api-starter

> AI 友好的 TypeScript API 底座 — NestJS + Prisma + PostgreSQL。

后续承载:公益救援队内部管理系统、U Studio 内部系统、客户项目二开、各类小程序后台。

> **Template baseline: `v0.1.7`.** The `main` branch is currently in **template-freeze mode** — only docs / CI trigger paths may change. New business modules should be developed in **downstream projects** derived from this baseline (e.g. `u-rescue-api`), not in this template repo. 模板已冻结于 `v0.1.7`,新业务模块请在派生项目中开发,详见下文「派生新项目」章节。

---

## 必读文档(改代码前请先读)

| 文档 | 作用 |
|---|---|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | v1 蓝图,数据模型 / 接口清单 / 命名铁律 / 升级路径,**所有规则的唯一来源** |
| [`CLAUDE.md`](./CLAUDE.md) | Claude Code 协作铁律(从 ARCHITECTURE.md §7 抽取) |
| [`AGENTS.md`](./AGENTS.md) | 通用 AI Agent 协作铁律(与 CLAUDE.md 内容同步) |
| [`docs/development.md`](./docs/development.md) | 项目结构 / 路由总览 / 环境变量 / 排错 |
| [`docs/testing.md`](./docs/testing.md) | E2E 测试运行与覆盖范围 |
| [`docs/deployment.md`](./docs/deployment.md) | Docker 镜像、生产部署、迁移流程 |
| [`docs/security.md`](./docs/security.md) | 已落地安全策略、软删除策略、token 吊销升级路径 |

冲突时**以 `ARCHITECTURE.md` 为准**。除非用户明确要求,AI 不得修改 `ARCHITECTURE.md`。

---

## 环境要求

- **Node.js** ≥ 22 LTS
- **pnpm** 10.14.0(已在 `package.json#packageManager` 钉版本,**禁止使用 npm / yarn / bun**)
- **Docker**:本地开发用 `docker-compose.yml` 起 PostgreSQL;生产构建用多阶段 [`Dockerfile`](./Dockerfile)

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

服务起来后,浏览器打开 <http://localhost:3000/api/docs> 即可看到 Swagger UI,在线调试所有接口。

---

## 默认账号

| 字段 | 值 |
|---|---|
| username | `admin` |
| password | `ChangeMe123456` |
| role | `SUPER_ADMIN` |

**⚠ 仅供本地开发使用。** 生产部署前必须修改 `SUPER_ADMIN_USERNAME` / `SUPER_ADMIN_PASSWORD` / `JWT_SECRET` / `APP_CORS_ORIGIN`,启动时会做强校验,任一不满足直接抛错退出。详见 [`docs/deployment.md`](./docs/deployment.md)。

---

## 路由总览

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| `GET` | `/api/health` | 公开 | 服务健康检查(向后兼容) |
| `GET` | `/api/health/live` | 公开 | K8s liveness — 进程存活 |
| `GET` | `/api/health/ready` | 公开 | K8s readiness — DB 连通 |
| `POST` | `/api/auth/login` | 公开 | `username + password` 登录,返回 JWT;**默认 IP 维度限流 5 次 / 60 秒** |
| `GET` `PATCH` | `/api/users/me` | 登录 | 本人资料读取 / 修改(仅 nickname / avatarKey) |
| `GET` `POST` | `/api/users` | super admin / admin | 用户列表(分页) / 创建用户 |
| `GET` `PATCH` `DELETE` | `/api/users/:id` | super admin / admin | 详情 / 改资料 / 软删除 |
| `PUT` | `/api/users/:id/password` | super admin / admin | 重置用户密码 |
| `PATCH` | `/api/users/:id/role` | **super admin only** | 修改用户角色 |
| `PATCH` | `/api/users/:id/status` | super admin / admin | 启用/禁用用户 |
| `GET` | `/api/docs` | 开发环境默认开启 | Swagger UI(生产需 `ENABLE_SWAGGER=true`) |

完整字段、错误码归属与示例详见 [`docs/development.md`](./docs/development.md) 与 [`ARCHITECTURE.md`](./ARCHITECTURE.md) §6。

---

## 常用命令

```bash
# 开发
pnpm start:dev         # watch 模式启动
pnpm build             # 编译到 dist/
pnpm start:prod        # 跑编译后的产物

# 代码质量
pnpm lint              # ESLint(覆盖 src / test / prisma)
pnpm typecheck         # tsc --noEmit
pnpm format            # prettier --write

# Prisma
pnpm prisma:migrate    # 开发环境:应用 migration(可能生成新 migration 文件)
pnpm prisma:deploy     # 生产环境:仅应用已审查、已提交的 migration
pnpm prisma:seed       # 写入默认 super admin(幂等)
pnpm prisma:studio     # 图形化数据库 GUI

# 测试(三档,均为护栏,合并前都应通过)
pnpm test              # unit:不启动 Nest、不连数据库,纯函数 / 类单测,毫秒级反馈
pnpm test:contract     # contract:OpenAPI 契约快照,锁住 14 个接口的 schema,防止误改入参 / 出参 / 错误码
pnpm test:e2e          # e2e:端到端 API 测试,启动真实 Nest + 真实 Postgres(app_test 库)

# E2E 测试库管理
pnpm db:test:init      # 在 Postgres 容器里幂等创建 app_test 测试库(首次)
pnpm db:test:reset     # 出现脏数据时重置 app_test
```

`pnpm test:e2e` 详细说明见 [`docs/testing.md`](./docs/testing.md);Docker / 生产部署 / 迁移策略见 [`docs/deployment.md`](./docs/deployment.md)。

---

## 派生新项目(Use this template)

本仓库已进入 **template-freeze 模式**,新业务请通过 GitHub `Use this template` 派生到独立仓库后再开发。模板自身不再堆叠业务模块,只接受 docs / CI 路径的小幅调整。

### 一、派生步骤

**1. 基于 GitHub Template 创建新仓库**

在本仓库 GitHub 页面点 **`Use this template` → `Create a new repository`**(若按钮不可见,请仓库维护者先在 *Settings → General* 勾选 *Template repository*)。推荐命名风格:

| 业务方向 | 推荐仓库名 |
|---|---|
| 公益救援队内部管理 | `u-rescue-api` |
| U Studio 内部系统 | `u-studio-internal-api` |
| 微信小程序后台 | `u-mp-<biz>-api` |
| 客户项目二开 | `<client>-api` |

**2. 本地 clone 后,替换 8 处身份字段**

下表以派生为 `u-rescue-api` 为例。所有改动都是**字符串字面量替换**,不动任何业务逻辑:

| # | 文件 | 字段 | 替换为(示例) |
|---|---|---|---|
| 1 | `package.json` | `name` | `u-rescue-api` |
| 2 | `package.json` | `description` | `公益救援队内部管理 API` |
| 3 | `package.json` | `repository`(若有) | 新仓库 git URL |
| 4 | [`src/bootstrap/apply-swagger.ts`](./src/bootstrap/apply-swagger.ts) | `setTitle(...)` | `'U Rescue API'` |
| 5 | [`src/bootstrap/apply-swagger.ts`](./src/bootstrap/apply-swagger.ts) | `setDescription(...)` | `'公益救援队内部管理 API'` |
| 6 | `docker-compose.yml` | `services.postgres.container_name` | `u-rescue-api-postgres` |
| 7 | `docker-compose.yml` | `POSTGRES_DB` | `u_rescue_api` |
| 8 | `.env.example` 与本地 `.env` | `DATABASE_URL` 中数据库名 | `postgresql://.../u_rescue_api` |

**3. 重置 release 元数据(可选,推荐做)**

派生项目的版本号语义独立于模板,建议从 `0.1.0` 重新计数:

- `package.json#version` → `0.1.0`
- [`src/bootstrap/apply-swagger.ts`](./src/bootstrap/apply-swagger.ts) `setVersion(...)` 同步
- `CHANGELOG.md` 清空历史,从派生项目自己的 `0.1.0` 起重写(模板的 v0.1.x 历史对派生项目无信息价值)
- 删除从模板继承的 git tag:`git tag -l 'v*' | xargs -r git tag -d`

**4. 起新数据库 + seed**

```bash
docker compose up -d
pnpm install
pnpm prisma:migrate
pnpm prisma:seed
pnpm start:dev
```

**5. 开始加业务模块**

按 [`ARCHITECTURE.md`](./ARCHITECTURE.md) §3 / §6 / §7 在 `src/modules/<name>/` 下**平铺**新模块,固定 4 文件结构:

```
src/modules/<name>/
├── <name>.module.ts
├── <name>.controller.ts
├── <name>.service.ts
└── <name>.dto.ts
```

新 BizCode 按模块段位分配(`110xx` 起每模块 200 个号段),新数据表走新 Prisma migration 增量演进。

### 二、派生项目**绝不要碰**的文件

**派生即引用** — 以下文件是模板的"宪法",修改即偏离规范、失去 AI 协作的边界保证:

| 类别 | 路径 | 为什么不能碰 |
|---|---|---|
| 三件套铁律 | [`ARCHITECTURE.md`](./ARCHITECTURE.md) / [`CLAUDE.md`](./CLAUDE.md) / [`AGENTS.md`](./AGENTS.md) | 所有规则的唯一来源,AI 协作时优先于代码 |
| 全局基础件 | `src/common/**` | 拦截器 / 异常过滤器 / 装饰器 / Pipe / Guard / `BizCode` 编码段 |
| 登录参考实现 | `src/modules/auth/**` | 登录手写实现、timing 防御、防账号枚举的参考样本 |
| 用户参考实现 | `src/modules/users/**` | 软删除、`assertCanManageUser`、最后一个 SUPER_ADMIN 保护的参考样本 |
| 健康检查 | `src/modules/health/**` | `@nestjs/terminus` + `BizCode.INTERNAL_ERROR` 的 ready 失败映射 |
| Migration 历史 | `prisma/migrations/**` | 已应用的 migration 不可改写;新业务表必须通过新 migration 增量演进 |

如果派生过程中发现这些文件**确实**需要改(而非"想改"),停下来评估:多半是规范本身需要演进,应该作为反哺改动回流模板,而不是在派生项目里 fork 出独立分叉。

### 三、何时反哺回模板?

派生项目跑出共性问题(规范遗漏、铁律说不清、common utility 缺失)时,按 [`ARCHITECTURE.md`](./ARCHITECTURE.md) §9 升级路径评估是否回流。原则:

- **业务诉求驱动,不为升级而升级**
- 反哺改动作为模板自身的 `v0.x.y` release,走 PR review、打 tag、写 CHANGELOG
- 派生项目的**业务模块 / 业务表 / 业务接口不回流**模板

模板的价值是"长期稳定的协作底座",不是"功能仓库"。
