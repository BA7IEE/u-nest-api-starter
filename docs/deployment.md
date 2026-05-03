# 部署指南

> V1.1 起仅交付应用镜像本身;`docker-compose.yml` 仅供本地起 PostgreSQL,生产部署形态由部署环境决定。

---

## V1.1 已落地的工程能力

V1.1 在 v1 业务接口与数据模型不变的前提下补齐基础工程能力。规范定义见 [`ARCHITECTURE.md`](../ARCHITECTURE.md) §11、[`AGENTS.md`](../AGENTS.md) §17、[`CLAUDE.md`](../CLAUDE.md) §17;任务清单与验收标准见 [`TASKS.md`](../TASKS.md)。

| 能力 | 说明 |
|---|---|
| GitHub Actions CI | 每次 push / PR 自动跑 `lint` + `typecheck` + `pnpm test:e2e`(基于 docker-compose 启动 `postgres:16-alpine`) |
| 结构化日志 | `nestjs-pino` 输出 JSON,生产 stdout 直出;非生产由 `pino-pretty` 美化(`pino-pretty` 是 dev 依赖,生产镜像 runner 阶段不包含)。敏感字段日志显示为 `[REDACTED]`,清单详见 [`security.md`](./security.md) |
| 请求 ID `x-request-id` | 客户端可传入沿用,缺失时由 `cuid()` 生成;同时回写响应头并自动出现在每条日志的 `reqId` 字段中(不写入响应体、不进 JWT payload) |
| 优雅关闭 | `app.enableShutdownHooks()` + `PrismaService.onModuleDestroy()`,SIGTERM / SIGINT 时等待 in-flight 请求并干净断开 Prisma 连接 |
| 健康检查分层 | `/api/health`(向后兼容)/ `/api/health/live`(进程存活)/ `/api/health/ready`(基于 `@nestjs/terminus` 的 DB 连通探测);三端点均走统一响应包装 |
| helmet HTTP 安全头 | 默认开启 helmet,Swagger UI 路径 `/api/docs` 局部禁用 CSP 以保留交互能力 |
| 登录接口限流 | `POST /api/auth/login` 走 `@nestjs/throttler` 内存 storage,默认 IP 维度 5 次 / 60 秒。命中后返回 HTTP 429 + `{ code: 42900, message: "请求过于频繁，请稍后再试", data: null }`,**不在响应体或响应头中暴露阈值、剩余配额、重置时间**(包括 `Retry-After`) |
| Dockerfile 多阶段构建 | `deps` → `builder` → `runner` 三阶段,基于 `node:22-alpine`,以非 root 用户(`uid=1000 node`)运行;镜像内不包含 `.env*` / `.git` / `test/` / `.planning/` / 项目协作文档(由 [`.dockerignore`](../.dockerignore) 保证) |

V1.1 / V1.2 **没有**做的事(沿用 [`ARCHITECTURE.md`](../ARCHITECTURE.md) §9 升级条件):未引入 Redis / BullMQ / 队列;未接入 OpenTelemetry / Sentry / APM / Prometheus;未实现 RBAC / refresh token / 多租户 / 文件上传 Provider / LLM;未持久化审计日志;未交付 `docker-compose.prod.yml` / K8s manifests / 镜像推送脚本。

---

## Docker 镜像

### 构建

```bash
docker build -t u-nest-api-starter:v1.2 .
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
  u-nest-api-starter:v1.2
```

启动强校验在 `APP_ENV=production` 下会拒绝:`JWT_SECRET` 等于 `.env.example` 默认值、`APP_CORS_ORIGIN` 为空或 `*`、`SUPER_ADMIN_PASSWORD` 等于默认值(seed 时)、`SUPER_ADMIN_USERNAME=admin`(seed 时)。完整字段以 [`.env.example`](../.env.example) 为准。

---

## 生产数据库迁移原则

- 生产环境**只允许** `prisma migrate deploy`(已审查、已提交的 migration),仓库内的等价入口为 `pnpm prisma:deploy`;**禁止** `prisma migrate dev`
- 应用 runner 镜像默认只负责运行已构建的 NestJS 应用;**不会**在启动时自动执行 migration:Dockerfile 中没有 entrypoint 触发 `migrate deploy`,`CMD` 只跑 `node dist/main.js`
- migration 必须由部署流程**显式**触发(CI/CD pipeline 独立步骤、K8s `Job` / `initContainer` / Helm pre-upgrade hook、平台一次性 migration job 等),并在应用副本启动**之前**完成
- 应用 runner 镜像不保证包含 Prisma CLI(runner 阶段已裁掉 devDependencies)。如需在容器环境执行迁移,应使用 CI/CD 的源码工作区(直接 `pnpm prisma:deploy`),或单独构建 migrator 镜像
- 不在容器启动时自动 migrate 的原因:连库失败会触发反复重启(K8s rollback 行为不可控);多副本同时启动会让多个 `migrate deploy` 并发,Prisma migration_lock 不保证安全。详见 [`Dockerfile`](../Dockerfile) 文末注释
