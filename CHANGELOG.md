# Changelog

本仓库版本号在 `package.json#version` 与 Swagger `setVersion(...)` 同步维护;tag 由维护者按需打。

## v0.1.3 - 2026-05-03

V1.2 模板收敛 — 不新增业务功能,不修改 API 响应格式,不做破坏性数据库变更;只提升长期可维护性、AI 二开稳定性和文档可读性。

### Changed
- 同步项目版本号到 `0.1.3`(`package.json#version`、Swagger `setVersion('0.1.3')`)
- 拆分 `src/app.module.ts`:logger / request-id / throttle 配置抽到 `src/bootstrap/`(`logger-options.ts` / `request-id.ts` / `throttle-options.ts`),`AppModule` 仅保留模块注册与全局 Guard 注册
- 新增 `src/modules/users/users.policy.ts`:集中 `canViewUser` / `canManageUser` / `canCreateRole` / `canChangeRole` 4 个纯函数;`UsersService` 不再散落角色判断,SUPER_ADMIN 结构性不变式(自我保护、最后一个 SUPER_ADMIN 保护)仍由 service 内事务保障
- 拆分 `README.md`:复杂内容迁移到 `docs/development.md` / `docs/testing.md` / `docs/deployment.md` / `docs/security.md`,`README.md` 仅保留项目定位、快速启动、路由总览、常用命令、文档入口
- `docs/security.md` 显式记录:当前版本支持软删除但不提供 restore 接口、误删恢复需 DBA 人工处理、未来 restore 接口契约预定义为 `PATCH /api/users/:id/restore`(仅 SUPER_ADMIN);token 吊销不实现 refresh token / Redis blacklist,仅记录未来 `tokenVersion` 升级路径
- 新增 `FINAL_REPORT.md`:本轮变更文件 / 原因 / 验收 / 遗留风险 / 建议 commit 命令
- 新增 `docs/v1.3-plan.md`:V1.3 Contract Hardening Plan(仅文档,不执行)

### Not changed
- API 响应格式、HTTP status、错误码、Swagger schema 与 v0.1.2 完全一致
- `prisma/schema.prisma` 与已存在 migration 不变
- 14 个业务接口路径 / 方法 / 入参 / 出参 / 权限标注与 v0.1.2 完全一致
- `.env.example` / `Dockerfile` / `.dockerignore` / `docker-compose.yml` / `.github/workflows/` 未触碰
- E2E 全量 19 spec / 162 用例继续通过(本机 ~15.6s)

## v0.1.2 - 2026-05-03

V1.1.1 工程收口修补 — 不引入新业务,不重构架构,只对 V1.1 之后暴露的版本一致性、生产迁移命令、CI 闭环、lint/typecheck 覆盖范围、README 残留表述做最小修补,并作为 patch release 正式发布。

### Fixed
- 同步项目版本号到 `0.1.2`(`package.json#version`、Swagger `setVersion('0.1.2')`),与本次 `v0.1.2` patch release 对齐
- 新增 `pnpm prisma:deploy` 脚本,作为生产数据库迁移固定入口(等价 `prisma migrate deploy`);保留 `pnpm prisma:migrate` 作为开发态入口
- CI 在 `typecheck` 之后、E2E 之前新增 `pnpm build` 步骤,显式验证 `tsconfig.build.json` 与 nest 构建产物链路
- CI 新增独立 `docker-build` job,验证多阶段 `Dockerfile` 在 CI 环境可成功构建出生产镜像(不做容器启动 / smoke test)
- CI 在数据库初始化之后、E2E 之前显式跑一次 `pnpm prisma:deploy`,验证生产迁移命令可执行(已迁移环境下为 no-op)
- `pnpm lint` 覆盖范围扩展为 `src/**/*.ts` + `test/**/*.ts` + `prisma/**/*.ts`
- `pnpm typecheck` 在原有 `tsconfig.json` 基础上追加 `test/tsconfig.test.json`,让测试代码也进入类型检查
- ESLint 显式 `project` 列表覆盖 `src` / `test` / `prisma` 三处源码;新增 `prisma/tsconfig.eslint.json` 仅供 ESLint 解析使用,不进入运行时构建链路;规则写入 `ARCHITECTURE.md` §11.7
- README 修正 V1.1 之后已不再准确的表述(Docker 用途、生产迁移策略、`prisma:deploy` 入口、runner 镜像不含 Prisma CLI 的说明)
- 新增 `CHANGELOG.md` 跟踪发布历史

## v0.1.1

- V1.1 engineering hardening
- Added GitHub Actions CI(lint / typecheck / E2E,基于 `docker compose` 启动 `postgres:16-alpine`)
- Added 多阶段 Dockerfile(`deps` → `builder` → `runner`,`node:22-alpine`,以非 root 用户运行)
- 接入结构化日志(`nestjs-pino`)与请求 ID(`x-request-id`,`cuid()` 兜底生成),敏感字段日志显示为 `[REDACTED]`
- 优雅关闭(`app.enableShutdownHooks()` + `PrismaService.onModuleDestroy()`)
- 健康检查分层(`/api/health` / `/api/health/live` / `/api/health/ready`,基于 `@nestjs/terminus`)
- helmet HTTP 安全头(Swagger UI 局部禁用 CSP)
- 登录接口限流(`@nestjs/throttler` 内存 storage,默认 IP 维度 5 次 / 60 秒)
- 扩展 E2E 覆盖(当前 19 spec / 162 用例)

## v0.1.0

- v1 基础闭环:NestJS + Prisma + PostgreSQL + Docker Compose + Swagger + JWT 登录 + 用户 CRUD + 简单角色权限 + 统一异常与返回格式
