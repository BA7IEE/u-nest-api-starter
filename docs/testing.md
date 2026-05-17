# 测试指南

项目测试分三档,合并前都应在 CI 中通过:

| 档 | 命令 | 范围 | 入口配置 |
|---|---|---|---|
| **unit** | `pnpm test` | 不启动 Nest、不连数据库的纯函数 / 类单测,毫秒级反馈 | [`test/jest-unit.config.ts`](../test/jest-unit.config.ts) |
| **contract** | `pnpm test:contract` | OpenAPI 契约快照,锁住业务接口的 schema,防止误改入参 / 出参 / 错误码 | [`test/jest-contract.config.ts`](../test/jest-contract.config.ts) |
| **e2e** | `pnpm test:e2e` | 端到端 API 测试,启动真实 Nest + 真实 Postgres(`app_test` 库) | [`test/jest-e2e.config.ts`](../test/jest-e2e.config.ts) |

e2e 跑在独立的 `app_test` 物理库,与开发库 `app` 完全隔离,**不污染开发数据**。配置由 [`.env.test`](../.env.test) 驱动,Jest globalSetup 与 setupFiles 双层加载并强制 `override: true`,防止 shell 中已 export 的 `DATABASE_URL` 误打开发库。e2e 串行执行(`--runInBand`),`detectOpenHandles: true` 启用,无连接泄漏。

> **关于测试用例数量**:本文不再硬编码具体用例数。需要查看当前实际数量时,运行对应命令以 Jest 输出为准(例如 `pnpm test:e2e --listTests` 列出 spec 文件,跑完后 Jest 输出 `Tests: X passed` 给出用例数)。本目录下的 [`release-tasks/`](./release-tasks/) 历史文档中保留的旧数字反映当时事实,不代表当前。

---

## 准备与运行

```bash
# 1. 起 PostgreSQL 容器(若尚未起)
docker compose up -d

# 2. 首次跑测试前,创建 app_test 库(幂等,已存在则跳过)
pnpm db:test:init

# 3. 跑 E2E
pnpm test:e2e

# watch 模式
pnpm test:e2e:watch

# 出现脏数据时重置 app_test(护栏:DATABASE_URL 不含 'app_test' 拒绝执行)
pnpm db:test:reset
```

任何破坏性操作(`TRUNCATE`、`prisma migrate deploy`、`prisma migrate reset`)在执行前都会断言 `DATABASE_URL` 包含 `app_test` 子串,不通过立即抛错。详见 [`test/setup/test-db.ts`](../test/setup/test-db.ts)。

---

## 覆盖范围一览

| spec 文件 | 覆盖内容 |
|---|---|
| [`health`](../test/e2e/health.e2e-spec.ts) | 健康检查响应包装 |
| [`response-format`](../test/e2e/response-format.e2e-spec.ts) / [`swagger`](../test/e2e/swagger.e2e-spec.ts) / [`bizcode-http-status`](../test/e2e/bizcode-http-status.e2e-spec.ts) | 横切:统一响应格式 / Swagger 跳过包装 / BizCode httpStatus 一致性 |
| [`auth-login`](../test/e2e/auth-login.e2e-spec.ts) / [`auth-jwt-guard`](../test/e2e/auth-jwt-guard.e2e-spec.ts) | 登录正反路径(含防账号枚举四场景一致性)+ JWT 鉴权失效全部分支 |
| [`users-me`](../test/e2e/users-me.e2e-spec.ts) | 本人接口 GET /me、PATCH /me(字段白名单 + 长度边界) |
| [`users-admin-list`](../test/e2e/users-admin-list.e2e-spec.ts) / [`users-admin-crud`](../test/e2e/users-admin-crud.e2e-spec.ts) / [`users-role-boundary`](../test/e2e/users-role-boundary.e2e-spec.ts) | 管理接口分页 / CRUD 基础路径 / 跨角色边界 |
| [`users-self-protection`](../test/e2e/users-self-protection.e2e-spec.ts) / [`users-last-super-admin`](../test/e2e/users-last-super-admin.e2e-spec.ts) / [`users-soft-delete`](../test/e2e/users-soft-delete.e2e-spec.ts) / [`users-password-reset`](../test/e2e/users-password-reset.e2e-spec.ts) | 自我保护 / SUPER_ADMIN 互操作正向回归 / 软删副作用矩阵 / 密码重置完整流程 |
| [`seed`](../test/e2e/seed.e2e-spec.ts) | `prisma/seed.ts` 子进程行为 + production 强校验 |

---

## 编写新 E2E 的约束

- E2E 必须断言统一响应格式;错误响应必须**同时断言 HTTP status code 与 `BizCode.httpStatus` 一致**
- 登录失败必须覆盖防账号枚举四场景(`username` 不存在 / `password` 错 / 已禁用 / 已软删除),响应体与 HTTP status 完全相同
- 任何破坏性 SQL 与 migration 命令统一通过 [`test/setup/test-db.ts`](../test/setup/test-db.ts) 调度,禁止在 spec 内 inline 执行,以保证 `app_test` 子串护栏始终命中

详见 [`CLAUDE.md`](../CLAUDE.md) §16。
