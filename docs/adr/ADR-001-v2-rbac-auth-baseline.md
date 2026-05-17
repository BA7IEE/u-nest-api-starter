# ADR-001: v2.0 RBAC + Auth Baseline(母版 baseline reset)

- 状态:**Accepted**
- 立项日期:2026-05-18
- Accepted 日期:2026-05-18(Phase 0 PR 最终收尾)
- 决策者:David 老灯(模板维护者)
- 影响范围:**模板仓库自身 baseline 重置**,不是派生项目能力解锁

> 本 ADR 是 **u-nest-api-starter 自身的 v1 → v2.0 baseline 重置决策**,不是派生项目的 B 类能力解锁。
> 派生项目若已在 v1.x 之上稳定运行,升级到 v2.0 需要按 §7 提供的迁移路径自行评估。

---

## 1. 背景与动机

### 1.1 v1 现状

- v1 蓝图把 **RBAC / refresh token / 本人改密码 / logout** 全部列为"v1 不做"
  - `ARCHITECTURE.md` §1 设计原则末条"不预先做 RBAC、多租户、刷新 token"
  - `ARCHITECTURE.md` §4 "不做"清单
  - `ARCHITECTURE.md` §7.11 长篇论证"三层 Role 不是 RBAC,不要渐进改造"
  - `CLAUDE.md` §1 / `AGENTS.md` §1 全部以 `[B]` 标签标注为"派生项目按 ADR 解锁"
  - `docs/capability-unlock-matrix.md` 以 B-1 / B-7 / B-8 形式列为派生项目可解锁能力
- 实际权限模型:`User.role` 单值 enum(`SUPER_ADMIN | ADMIN | USER`),`@Roles` 装饰器 + `RolesGuard` 全局注册
- 认证模型:单个 JWT(`JWT_EXPIRES_IN=7d`),无 refresh、无 logout,管理员要立即阻断用户访问只能 `status=DISABLED`

### 1.2 触发本次升级的诉求

派生项目反复出现以下需求,而 v1 反复要求"走 ADR 单独解锁":

| 诉求 | v1 处理 | 真实场景 |
|---|---|---|
| 给同一用户多个角色 | 不支持(单值 enum) | 内管系统几乎必需 |
| 后台可配角色 / 权限 | 不支持(枚举硬编码) | 客户提"权限要后台改" |
| 短 TTL access + 长 TTL refresh | 不支持 | 7d access token 安全敞口大 |
| 主动登出 | 不支持(只能等过期) | 用户基础诉求 |
| 异常会话回收 | 仅靠 `status=DISABLED` 粗暴禁用账号 | 多设备登录场景下伤害正常使用 |

### 1.3 结论

v1 把"RBAC / refresh / logout"列为禁止项的理由(实现成本高、与业务强耦合)在**模板自身演进的视角下不再成立**:这些是**任何严肃后端 baseline 都应直接提供的能力**,不是"以后用到再加"的可选项。

**v2.0 把 RBAC + refresh token + logout 一次性纳入 baseline**,是 v1 历史限制的修订,不再继续约束 v2.0。

---

## 2. 涉及的模板规则(必须同步修订的文档原文位置)

| 文档 | 章节 | 当前表述 | v2.0 修订方向 |
|---|---|---|---|
| `ARCHITECTURE.md` | §1 设计原则末条 | "不预先做 RBAC、多租户、刷新 token" | 删 RBAC / refresh;多租户仍保留 |
| `ARCHITECTURE.md` | §4 v1 范围 "不做" 表 | 列 RBAC / refresh / 本人改密码 | 这些行迁出"不做",改入 v2.0 baseline 章节 |
| `ARCHITECTURE.md` | §5 数据模型 | 仅 User 一张表 | 新增"v2.0 baseline 数据模型"小节(引用本 ADR §4.1) |
| `ARCHITECTURE.md` | §6 接口清单 | `PATCH /api/users/:id/role` | 标注 v2.0 替换为 `PUT /api/users/:id/roles` + 新增 `/api/roles*` / `/api/permissions` / `/api/auth/refresh` / `/api/auth/logout` |
| `ARCHITECTURE.md` | §7.11 RBAC 否定章 | 整章论证"三层 Role 不是 RBAC,不要渐进改造" | 重写为 "v1 历史模型(回顾)+ v2.0 RBAC baseline(本 ADR §4)" |
| `ARCHITECTURE.md` | §8 环境变量 | `JWT_EXPIRES_IN=7d` | 替换 `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` |
| `ARCHITECTURE.md` | §9 升级路径 | "真要做权限点到按钮级 → ADR";"真有无感续期诉求 → ADR" | 删除这两行(已是 baseline) |
| `CLAUDE.md` | §1 v1 不做 | `[B]` RBAC / refresh token / 本人改密码 | RBAC + refresh + logout 迁入 v2.0 baseline;本人改密码仍走 ADR(B-8 保留) |
| `CLAUDE.md` | §8 权限与鉴权 | JwtPayload 不塞 role | 改:不塞 roles / permissions(语义升级,实质不变);加 `typ` + `jti` 说明 |
| `CLAUDE.md` | §13 角色层级 | 三层 Role + 散写边界 | 重写为 "v2.0 RBAC 五条 super_admin 铁律 + 权限码命名规则" |
| `AGENTS.md` | §1 / §8 / §13 | 同 CLAUDE.md | 同步 |
| `docs/capability-unlock-matrix.md` | §A 永久红线 27 条 | — | 扩展至 29 条(权限码命名 + refresh 哈希存储) |
| `docs/capability-unlock-matrix.md` | §B B-1 / B-7 / B-8 | 派生项目可解锁 | B-1 / B-7 (refresh + logout 部分) 改为 "v2.0 baseline 已覆盖";B-7 残余(access 黑名单 / 异常重放全链路吊销)与 B-8(本人改密码)保留 |
| `docs/capability-unlock-matrix.md` | §B | — | 新增 B-12 部分通配权限 / B-13 `@AnyPermission` / B-14 数据级权限 / B-15 角色继承与部门范围 |

---

## 3. 候选方案

### 方案 A — 保留 v1 三层 Role,渐进加 permission 表

- 优点:对现有代码侵入小
- 缺点:违背 §7.11 反复论证的"渐进改造是反模式"原则;`User.role` 与 `userRoles` 双轨易漂移;6 个 E2E 仍依赖 enum 字面值
- 实现成本:看似低,实际维护成本高,等于把"以后该升级"的债务永久背在身上

### 方案 B — v2.0 baseline 重置(采纳)

- 优点:模板一次性到位;派生项目不需要再写 RBAC / refresh / logout 这种"通用工程能力"的 ADR;v1.x 派生项目按 §7 提供的迁移路径升级
- 缺点:breaking change 面广;v1.x 派生项目升级需要写一次性数据迁移;6 个 E2E + OpenAPI 快照需重写
- 实现成本:Phase 0(本 ADR)+ Phase 1-4(后续 PR),独立 commit

### 方案 C — 只升级 RBAC,refresh / logout 仍走派生项目 ADR

- 优点:single concern,本期 PR 体积小
- 缺点:派生项目反复在 ADR 里重写 refresh / logout,本质是"该是 baseline 的能力被推给了业务侧";token 模型与权限模型其实是同一层的事(都是 auth baseline),分两次升级不如一次性做完
- 实现成本:本期低,长期高(派生项目反复偿还相同的债)

---

## 4. 决策

**采纳方案 B**:v2.0 baseline 一次性把 RBAC + refresh token + logout 纳入模板,模板仓库执行 baseline 重置 migration,派生项目按 §7 自行评估升级路径。

### 4.1 v2.0 数据模型(Prisma schema 设计草案)

> 仅作为本 ADR 的设计草案,**Phase 0 不动 `prisma/schema.prisma`,不创建 migration**。Phase 1 才落地。

```
model User {
  id            String         @id @default(cuid())
  username      String         @unique
  email         String?        @unique
  passwordHash  String
  nickname      String?
  avatarKey     String?
  status        UserStatus     @default(ACTIVE)
  deletedAt     DateTime?
  lastLoginAt   DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  roles         UserRole[]
  refreshTokens RefreshToken[]

  @@index([deletedAt])
  @@index([status])
}
// ↑ 删除 User.role 字段
// ↑ 删除 enum Role(整个枚举)

model Role {
  id          String           @id @default(cuid())
  code        String           @unique           // 'super_admin' / 'admin' / 'user' / 派生业务自定义
  name        String
  description String?
  isSystem    Boolean          @default(false)   // baseline 3 个为 true
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  users       UserRole[]
  permissions RolePermission[]

  @@index([isSystem])
}

model Permission {
  id          String           @id @default(cuid())
  code        String           @unique           // 'user:read' / '*' / 'user_role:assign'
  resource    String
  action      String
  description String?
  isSystem    Boolean          @default(true)
  createdAt   DateTime         @default(now())

  roles       RolePermission[]

  @@index([resource])
}

model UserRole {
  userId     String
  roleId     String
  assignedAt DateTime @default(now())
  assignedBy String?

  user       User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role       Role @relation(fields: [roleId], references: [id], onDelete: Restrict)

  @@id([userId, roleId])
  @@index([roleId])
}

model RolePermission {
  roleId       String
  permissionId String
  grantedAt    DateTime @default(now())

  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Restrict)

  @@id([roleId, permissionId])
  @@index([permissionId])
}

model RefreshToken {
  id          String    @id @default(cuid())
  userId      String
  tokenHash   String    @unique             // sha256(rawToken),DB 不存明文
  expiresAt   DateTime
  revokedAt   DateTime?
  createdAt   DateTime  @default(now())
  userAgent   String?
  ipAddress   String?

  user        User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

enum UserStatus {  // 保留,account-level 状态,不是权限模型
  ACTIVE
  DISABLED
}
```

### 4.2 权限码命名(永久红线,不允许例外)

- 格式:`<resource>:<action>`,小写 snake_case,**两段式严格**
- `resource` 可以含下划线表示"虚拟资源"(`user_role` = 用户-角色关系)
- 通配只有一档:`*`(全权)。**不支持** `user:*` / `*:read`(若要走 ADR B-12 解锁)
- **不允许"唯一例外"** — 旧设计中曾出现 `user:role:assign` 三段式,本 ADR 明确否决,改为 `user_role:assign`

### 4.3 baseline 7 条权限

| code | 守护接口 |
|---|---|
| `*` | 通配(仅 super_admin 角色拥有) |
| `user:read` | `GET /api/users` / `GET /api/users/:id` |
| `user:write` | 创建用户 / 改资料 / 重置密码 / 启用禁用 / 软删 |
| `user_role:assign` | `PUT /api/users/:id/roles`(给用户分配/撤销角色) |
| `role:read` | `GET /api/roles*` |
| `role:write` | 创建/修改/删除非系统角色 + `PUT /api/roles/:id/permissions` |
| `permission:read` | `GET /api/permissions` |

### 4.4 baseline 3 个种子角色

| code | name | isSystem | 权限关联 |
|---|---|---|---|
| `super_admin` | 超级管理员 | true | `*` |
| `admin` | 管理员 | true | `user:read`, `user:write`, `role:read`, `permission:read` |
| `user` | 普通用户 | true | (空集合) |

- `admin` 默认**不**拥有 `user_role:assign` 与 `role:write`(对应 v1 "只有 SUPER_ADMIN 能改角色"的语义传承)
- `user` 角色权限集为空,只能访问"已登录即可"的 `/api/users/me` / `/api/auth/logout` / `/api/auth/refresh`
- 三个 baseline 角色的 `code` 永久不可改;`name` / `description` 可改
- `super_admin` 的权限关联永久锁死为 `[*]`;`admin` / `user` 的权限关联派生项目可调整
- **可选**:派生项目若需要"权限管理员"(管角色和权限但不动用户业务数据),建议自建 `rbac_admin` 角色,授予 `role:read` / `role:write` / `user_role:assign` / `permission:read`。**不进 baseline**

### 4.5 super_admin 五条铁律(展开自 v1 §7.11)

任何路径、任何角色组合、任何 ADR 解锁都必须保证下列五条全部成立:

| # | 规则 | 实现位置(Phase 2.2) | 抛错码 |
|---|---|---|---|
| 1 | 只有已有 super_admin 可以分配 super_admin | `users.service.assignRoles()` 入参含 `super_admin` 时检查 `currentUser.roles.includes('super_admin')` | `FORBIDDEN_ROLE_OPERATION` |
| 2 | 非 super_admin 不得授予 super_admin | 同上(对偶视角) | `FORBIDDEN_ROLE_OPERATION` |
| 3 | 禁止移除最后一个 active super_admin 身份 | `assignRoles()` 事务内 count | `LAST_SUPER_ADMIN_PROTECTED` |
| 4 | 禁止禁用 / 软删最后一个 active super_admin | `updateStatus(DISABLED)` / `softDelete()` 事务内 count | `LAST_SUPER_ADMIN_PROTECTED` |
| 5 | 禁止用户移除自己的 super_admin 身份 | `assignRoles()` 检查 `targetId === currentUser.id && oldHasSA && !newHasSA` | `CANNOT_OPERATE_SELF` |

**重要**:第 1 / 2 条**取代** v1 "任何业务 API 都不能产生新 super_admin" 的旧表述。v2.0 super_admin **可以**通过业务 API 分配,但仅限已有 super_admin 操作;seed 创建第一个 super_admin 是冷启动手段。

### 4.6 Guard / Decorator / JwtPayload 设计

| 项 | v1 | v2.0 |
|---|---|---|
| `JwtPayload` 字段 | `{ sub, username }` | `{ sub, username, typ: 'access' \| 'refresh', jti: string }` |
| `CurrentUserPayload.role: Role` | 单值 | **删除**,改 `roles: string[]` + `permissions: Set<string>` |
| `JwtStrategy.validate()` | 查 user select role | nested include 查 `user → userRoles → role → rolePermissions → permission.code`,扁平化挂 request.user |
| 装饰器 | `@Roles(Role.X, Role.Y)` AND | `@Permissions('user:read', 'user:write')` AND |
| `@AnyPermission(...)` OR | — | baseline **不做**,**不是**永久禁止,走 ADR B-13 解锁 |
| Guard 全局注册 | `JwtAuthGuard → RolesGuard` | `JwtAuthGuard → PermissionsGuard`(顺序逻辑不变) |
| `@Roles` 兼容别名 | — | **不保留**,旧元数据 key `'roles'` 一并清理 |
| 通配匹配 | — | `if (owned.has('*')) pass`;部分通配 `user:*` 不支持(走 B-12) |
| `@Public()` 与 `@Permissions(...)` 互斥 | `@Public` vs `@Roles` | 保留互斥语义,Phase 3 加 E2E 用例守护(见 §9 修订点 E) |

### 4.7 Auth baseline(refresh + logout + rotation)

| Token | 默认 TTL | 存储 | 失效途径 |
|---|---|---|---|
| Access token | `15m`(`JWT_ACCESS_EXPIRES_IN`) | JWT 自包含 | 自然过期 / 用户禁用 / 软删 |
| Refresh token | `7d`(`JWT_REFRESH_EXPIRES_IN`) | `RefreshToken` 表(`tokenHash` sha256) | 自然过期 / `revokedAt` / rotation 旧 token / logout / 用户禁用或软删 |

**新增接口**:

| 接口 | 入参 | 出参 | 权限 |
|---|---|---|---|
| `POST /api/auth/login` | `username + password` | `{ accessToken, refreshToken, accessExpiresIn, refreshExpiresIn }`(出参 breaking) | `@Public()` |
| `POST /api/auth/refresh` | `{ refreshToken }` | 同 login 出参(rotation,旧 token 立即 `revokedAt`) | `@Public()`(身份校验走 token 本身) |
| `POST /api/auth/logout` | `{ refreshToken }` | `{ status: 'ok' }` | 仅要求 access token 登录(见 §9 修订点 C) |

**Refresh token 安全约束**:

- **哈希存储**:`tokenHash = sha256(rawToken)`,DB 不存明文(永久红线,见 §6)
- **Rotation 强制**:refresh 成功 → 旧 token `revokedAt = now()` + 创建新 token,同事务
- **重放检测 baseline**:已 `revokedAt` 的 token 再次被使用 → 抛 `UNAUTHORIZED`,**baseline 不主动吊销该用户全部 token**(异常重放全链路吊销见 §9 修订点 B + 走 ADR B-7 残余)
- **过期清理**:baseline 不引入定时任务清理,查询时显式过滤 `expiresAt < now()`
- **管理员重置密码后的旧 token**:baseline **不自动吊销**(传承 v1 §7.7 语义);需立即阻断改 `status=DISABLED`
- **用户禁用/软删时存量 refresh**:每请求查库覆盖 access 路径;refresh 接口额外校验 `user.status === ACTIVE && user.deletedAt === null`

### 4.8 接口契约变更摘要

| 接口 | v1 | v2.0 | 类型 |
|---|---|---|---|
| `PATCH /api/users/:id/role` | 单角色 `{ role }` | **删除** | breaking |
| `PUT /api/users/:id/roles` | — | 新增,`{ roleCodes: string[] }`,覆盖式 | new |
| `GET /api/users` / `:id` | 返回 `role` + 过滤可见范围 | 返回 `roles: string[]`,**不再过滤可见范围** | breaking |
| `POST /api/users` | `{ ..., role? }` | `{ ..., roleCodes?: string[] }`,默认 `['user']`(见 §9 修订点 D) | breaking |
| `GET/POST/PATCH/DELETE /api/roles*` + `PUT /api/roles/:id/permissions` | — | 新增 | new |
| `GET /api/permissions` | — | 新增(只读) | new |
| `POST /api/auth/login` | 出参 `{ accessToken }` | 出参 `{ accessToken, refreshToken, accessExpiresIn, refreshExpiresIn }` | breaking |
| `POST /api/auth/refresh` / `POST /api/auth/logout` | — | 新增 | new |
| `/api/users/me` / `GET /api/health*` | — | 行为不变 | 不变 |

---

## 5. 影响范围

### 5.1 Prisma schema(Phase 1 才动)

- 删 `User.role` 字段,删 `enum Role`
- 新增 5 张表:`Role` / `Permission` / `UserRole` / `RolePermission` / `RefreshToken`
- 保留:`User` 其余字段、`enum UserStatus`、`@@index([deletedAt])` / `@@index([status])`

### 5.2 migration(Phase 1 才动)

模板仓库执行**一次性 baseline 重置 migration**:

- 单次 migration:`v2_init_rbac_and_auth`(同时含 RBAC 五表 + RefreshToken 一表 + 删 `User.role` + 删 `Role` enum)
- **不提供 down migration**(baseline reset 不可回滚)
- `prisma/seed.ts` 改写为 idempotent upsert 7 条 permission + 3 条 role + 角色-权限映射 + super_admin 用户关联

### 5.3 BizCode 段位扩展

| 段 | 模块 | 新增码 |
|---|---|---|
| `110xx` | roles | `ROLE_NOT_FOUND=11001` / `ROLE_CODE_ALREADY_EXISTS=11002` / `SYSTEM_ROLE_PROTECTED=11003` |
| `120xx` | permissions | `PERMISSION_NOT_FOUND=12001`(后续按需扩) |
| 不新增 auth 段 | refresh / logout | token 无效 / 过期 / 已吊销 / typ 错统一抛 `UNAUTHORIZED=40100`(传承 v1 防枚举语义) |

### 5.4 API / DTO 变更

详见 §4.8。

### 5.5 测试(Phase 3 才动)

- **重写 6 个 v1 E2E**:`users-role-boundary` → `users-permission-boundary`、`users-last-super-admin` 改查 role.code=`super_admin`、`users-admin-list` 删"可见范围过滤"用例并加"admin 能看到 super_admin 行"用例、`users-admin-crud` 改入参出参、`users-me-*` 行为保留
- **新增至少 6 个 E2E**:`roles-crud` / `permissions-readonly` / `system-role-protected` / `auth-refresh-rotation` / `auth-logout` / `super-admin-five-rules` / `public-permissions-mutual-exclusion`(见 §9 修订点 E)
- **OpenAPI 契约快照**全部失效,需 `pnpm test:contract -u` 重生

### 5.6 文档(本 ADR 落地的范围)

Phase 0 修订:
- `ARCHITECTURE.md` §1 / §4 / §5 / §6 / §7.11 / §8 / §9,新增 §12 v2.0 baseline 升级章节
- `CLAUDE.md` 顶部 v2.0 公告、§1 翻转、§8 / §13 同步
- `AGENTS.md` 同 CLAUDE.md 同步
- `docs/capability-unlock-matrix.md` §A 扩到 29 条、B-1 / B-7 / B-8 翻转、新增 B-12/13/14/15
- `CHANGELOG.md` Unreleased 段记录"v2.0 文档宪法升级"
- 本 ADR 文件本身

---

## 6. 不变式声明(实施后仍保留)

下列**永久红线**在 v2.0 之后仍 100% 保留,任何后续 ADR 都不能削弱:

**安全底线类**

1. `passwordHash` 永不出响应(`userSafeSelect` 不能漏)
2. 密码落库前必须 `bcrypt.hash()`(salt rounds=10)
3. **`JwtPayload` 不塞 `roles` / `permissions` / 完整用户对象**;权限判定走本次查库(语义升级:从"不塞 role"扩到"不塞 roles/permissions")
4. 登录失败四场景统一响应(`LOGIN_FAILED` / HTTP 401)+ Timing 防御
5. 生产环境拒绝默认 `JWT_SECRET` / `APP_CORS_ORIGIN=*` / `SUPER_ADMIN_*` 默认值
6. 业务代码不直读 `process.env`,统一走 `*.config.ts`(`SUPER_ADMIN_*` 显式例外)
7. 全局 `APP_GUARD` 注册顺序(`JwtAuthGuard → PermissionsGuard`),禁止 controller `@UseGuards(...)`
8. `@Public()` 与 `@Permissions(...)` 互斥
9. super_admin 五条铁律(§4.5)+ 最后一个 active super_admin 保护
10. 日志 redact 清单(`password` / `passwordHash` / `token` / `refreshToken` / `secret` 等)命中必须 `[REDACTED]`
11. **(v2.0 新增)** refresh token 哈希存储,不存明文;rotation 时旧 token 立即失效

**契约稳定类**

12. 统一响应格式 `{ code, message, data }`
13. BizCode 三字段对象 + `BizException` 类型签名锁死
14. BizCode 段位规划(4xxxx/5xxxx 通用 / 100xx+101xx users / 110xx+ 后续模块每段 200 号)
15. Swagger 100% 覆盖,使用 `@ApiWrapped*` 装饰器
16. 响应拦截器跳过路径(`/api/docs` / `/api/docs-json` / `/metrics` / 文件下载流)
17. 健康检查向后兼容(`/api/health` 仍按 v1 契约)

**工程一致性类**

18. pnpm-only
19. 全局 `ValidationPipe`(`whitelist + forbidNonWhitelisted + transform`)
20. 入参 / 出参 DTO 分离,禁止 `*.entity.ts`
21. DTO 字段白名单(`UpdateMyProfileDto` / `UpdateUserDto` 不允许字段透传)
22. 唯一性预检查用 `findUnique`(含软删),业务详情用 `findFirst + notDeletedWhere`
23. 软删除走 `update({ deletedAt, status: DISABLED })`,禁止 `prisma.user.delete()`
24. 已应用 migration 不可改写,只能新增
25. `prisma migrate dev` 必须先说明再执行;生产只跑 `migrate deploy`
26. **(v2.0 新增)** 权限 code 是代码契约,**不进字典表**,后台无 create/update/delete 接口
27. **(v2.0 新增)** 权限 code 命名统一 `<resource>:<action>` 两段式,**不允许任何"唯一例外"**(`user_role:assign` 是把 user_role 当虚拟资源,不是三段式)

**文档协作类**

28. 派生项目不删改 `ARCHITECTURE.md` / `CLAUDE.md` / `AGENTS.md` 继承段落,优先追加
29. ADR 文件永不删,即使状态为 Rejected

---

## 7. 升级路径(向后)

### 7.1 模板仓库自身(Phase 0-4)

| Phase | 内容 | 产物 | PR |
|---|---|---|---|
| Phase 0 | **文档与 ADR(本 PR)** | 本 ADR + 5 个文档修订 | docs-only |
| Phase 1 | Prisma schema + migration + seed | `v2_init_rbac_and_auth` migration + seed 改造 | 含 prisma 改动 |
| Phase 2.1 | 装饰器 + Guard + JwtStrategy + CurrentUserPayload | 新 `permissions.*` 文件,删 `roles.*` 三件套 | 框架层 |
| Phase 2.2 | users 模块改造(controller / service / DTO / select / 五条铁律) | users 模块全量重写 | users 业务 |
| Phase 2.3 | roles 模块新建 | `modules/roles/` 4 文件 | new module |
| Phase 2.4 | permissions 模块新建(只读) | `modules/permissions/` | new module |
| Phase 2.5 | BizCode 段位扩展 | `110xx` / `120xx` | constants |
| Phase 2.6 | auth 模块扩展(RefreshToken + refresh + logout + rotation) | auth 业务扩展 | auth 业务 |
| Phase 3.1 | E2E 全量重写 + 新增 7 个 spec | `test/e2e/*` | tests |
| Phase 3.2 | OpenAPI 契约快照重生 | `test/contract/__snapshots__/*` | snapshots |
| Phase 4 | CHANGELOG v2.0.0 release note + capability-matrix 状态全表刷新 | release | release |

合并主线前先打 `v1.x-maintenance` 分支供派生项目按 v1 兜底。

> **注意**:§7.1 旧表把 Phase 1 / 2.x / 3.x / 4 各列为独立 PR,基于 Phase 0 之后做的 [Phase 1 可行性核查](#) 显示**Phase 1 单独 PR 不可合并 main**(删 `User.role` + 删 `Role` enum 会让 18 个文件 + 100+ 引用点同步 typecheck 红,CI 全红;详见本文 §7.1A 决策记录)。实际可合并的 PR 粒度修订为 **Phase 1+2+3 同一 PR 分 7 个逻辑 commit**(本文 §7.1A);**Phase 4 仍单独 PR**。

### 7.1A Phase 1+2+3 合并实施策略(基于可行性核查修订)

#### 7.1A.1 决策

**Phase 1+2+3 合并到同一实现 PR**(标题建议 `v2.0 baseline implementation: RBAC + Auth (Phase 1+2+3)`),分 **7 个逻辑 commit**;Phase 4(release / capability-matrix 状态全表刷新)仍单独 PR。

#### 7.1A.2 决策理由

- **Phase 1 单独 PR 不可合并 main**:删 `User.role` 字段 + 删 `enum Role` 后,`@prisma/client` 不再 export `Role`,**18 个文件**的 `import { Role }` + 100+ 处字面引用 + 9+ 处 `user.role` 字段访问全部 typecheck 错;CI required checks(Lint / Typecheck / E2E / Docker image build)100% 失败
- **不采用双轨过渡 schema**:违反本 ADR §4.1 "彻底删除 `User.role`,以 `UserRole` 多对多为唯一来源,不留双轨";事实源分裂会让派生项目读源码困惑
- **不采用临时手写 `Role` enum 占位**:违反 v1 永久红线"`Role` / `UserStatus` 唯一来源是 Prisma schema,禁止手写 `users.enum.ts`"(本 ADR §6 第 27 条扩展自此条)

#### 7.1A.3 7 个逻辑 commit 边界(对应 §7.1 旧表的 Phase 子项)

| Commit | 对应 Phase | 内容 | 预期 typecheck / e2e 状态 |
|---|---|---|---|
| **1** | Phase 1 | `prisma/schema.prisma`(删 `User.role` / 删 `enum Role` / 新增 5 张表)+ migration `v2_init_rbac_and_auth` + `prisma/seed.ts` 改写 idempotent upsert(7 权限 + 3 角色 + 关联 + super_admin 用户) | typecheck 红(预期);本地 `prisma migrate reset` 通过;seed 双跑幂等 |
| **2** | Phase 2.1 | 装饰器 + Guard + JwtStrategy + CurrentUserPayload:新增 `permissions.decorator.ts` / `permissions.guard.ts`;改 `current-user.decorator.ts`(去 `role`,加 `roles` / `permissions`);改 `jwt.strategy.ts`(nested include + `typ` + `jti` 校验);改 `app.module.ts`(`RolesGuard` → `PermissionsGuard`);删 `roles.decorator.ts` / `roles.guard.ts` 及其 spec | 框架层 typecheck 绿;users / e2e 仍红 |
| **3** | Phase 2.2 | users 模块改造 + 五条 super_admin 铁律:`users.controller.ts`(`@Roles` × 8 → `@Permissions`);`users.service.ts`(删 policy 引用 / 改五条铁律 / 改 RBAC 写读 / 防权限提升 §9.4);`users.dto.ts`(`UpdateUserRoleDto` → `AssignUserRolesDto`);`users.select.ts`(`role` → `roles`);删 `users.policy.ts` + `users.policy.spec.ts` | users 模块 typecheck 绿;e2e 仍红 |
| **4** | Phase 2.3-2.5 | 新增 `modules/roles/`(4 文件 CRUD + `PUT /api/roles/:id/permissions`)+ `modules/permissions/`(3 文件,只读);BizCode 扩 `110xx` / `120xx` + `biz-code.constant.spec.ts` 段位单测同步 | 全 src typecheck 绿;contract 快照红 |
| **5** | Phase 2.6 | auth 模块扩展:`auth.controller.ts`(新增 `refresh` / `logout`);`auth.service.ts`(rotation + sha256 哈希 + `jti`);`auth.dto.ts`(出参三字段);`config/jwt.config.ts`(`JWT_EXPIRES_IN` → `JWT_ACCESS_EXPIRES_IN` + `JWT_REFRESH_EXPIRES_IN`);同步 `.env.example` / `.env.test` | 全 src typecheck 绿;e2e 仍部分红 |
| **6** | Phase 3.1 | E2E 全量重写:fixture(`role` → `roleCodes`);改 6 个旧 spec(`users-role-boundary` 替换为 `users-permission-boundary`,`users-last-super-admin` 改查 `role.code='super_admin'`,`users-admin-list` 删可见范围过滤、加 admin 看到 super_admin 行用例,`users-admin-crud` / `users-me` / `users-password-reset` / `users-self-protection` / `users-soft-delete` / `seed` 按 RBAC 改造);新增 7 个 spec(`roles-crud` / `permissions-readonly` / `system-role-protected` / `auth-refresh-rotation` / `auth-logout` / `super-admin-five-rules` / `public-permissions-mutual-exclusion`)| e2e 全绿 |
| **7** | Phase 3.2 | OpenAPI 契约快照重生:改 `test/contract/openapi.contract-spec.ts`(路由白名单 + DTO 清单);`pnpm test:contract -u` 更新 snapshot | contract 全绿;**PR HEAD 全绿,可合并** |

#### 7.1A.4 不调整 GitHub branch protection

**不临时降级 / 不取消 / 不修改** branch protection 与 required checks:

- 中间 commit(1-6)在 CI 上预期会红,**这是合规预期**,不是 CI 故障
- GitHub Actions CI 默认对 PR 每个 push 都跑,但 required check **只校验 PR HEAD**(commit 7)的最终状态
- **只在 PR 最终 HEAD 全部 CI 通过后合并**;若 commit 7 推上去 CI 红,继续修复直到 HEAD 全绿,**不绕过 required check**
- 维护者 review 通过 + branch protection 通过 + PR HEAD CI 全绿 → 才能合并;**任何一项不满足都不合并**

> **替代旧版表述**:Phase 0 报告中曾建议"维护者临时降级 required checks 为 advisory" — **本节明确否决该做法**,避免开 CI 绕过先例。Required checks 必须始终保护 `main`。

#### 7.1A.5 中间 commit 的语义与红线

- **中间 commit(1-6)的作用**:作为 review 边界,供 maintainer 按 Phase 子项逐步 review,供派生项目升级时按相同顺序参考
- **绝对禁止**:中间 commit 单独合并到 `main`、单独 cherry-pick 到 `main` 或其它发布分支、单独 revert 到 `main`
- **中间 commit 在 PR 上下文之外没有意义**;它们仅作为完整 PR 的中间快照
- 派生项目若要把 v2.0 改造拆分到自己的 PR 序列,应**在派生项目自己的分支上重新做拆分**,而不是 cherry-pick 模板的中间 commit

#### 7.1A.6 合并方式

- **优先 `merge commit`**:保留 7 个 commit 边界供派生项目按图实施;`main` 上能看到清晰的 Phase 子项轨迹
- **不优先 `squash`**:squash 会丢失 7 个边界,降低派生项目参考价值;若团队 git history 偏好线性必须 squash,则在 release note 中显式列 7 个子步骤的内容
- **不允许 `rebase merge`**:rebase 会改写 commit hash 与时间戳,丢失 review 上下文

#### 7.1A.7 fixup commit 整理

实施过程中若产生大量 `fixup!` / `wip:` / `review feedback` 类临时 commit:

- 允许在 PR 开发期间自由 push,便于 review 增量看 diff
- **合并前必须本地 `git rebase -i` 整理为 7 个逻辑 commit**(对应 §7.1A.3 表),与 commit message 前缀按 `v2.0 phase X.Y: <简述>` 规范化
- 整理后 `force-push` 到 PR 分支(非 `main`),触发最终 CI 跑;CI 全绿后合并
- 不允许把 `fixup!` 直接带入 `main` 的 merge commit 历史

#### 7.1A.8 分支与 release 时序

| 时序 | 动作 | 验收 |
|---|---|---|
| ① | Phase 0(本 PR)合并 `main` | ADR-001 状态从 `Proposed` 改 `Accepted` + 回填日期;5 个文档修订入主 |
| ② | **立即**在 Phase 0 合并后 `main` HEAD 打 `v1.x-maintenance` 分支 | 供派生项目按 v1 兜底;后续 v1.x patch(如 v0.1.8)从该分支拉,**不**走 `main` |
| ③ | 从 `main` 开 `v2/rbac-auth-baseline` 实现分支 | 7 个 commit 按 §7.1A.3 推进;期间不合并 `main` 其它无关 PR(避免 conflict) |
| ④ | PR HEAD CI 全绿 + review 通过 → `merge commit` 进 `main` | branch protection 全部通过;不绕过任何 required check |
| ⑤ | Phase 4 单独 PR:CHANGELOG v2.0.0 release note + capability-matrix 状态全表 🟢 baseline-covered 行刷新 + 打 `v2.0.0` tag | release |

#### 7.1A.9 实施前必须明确的两个开放问题

| # | 问题 | 默认建议 |
|---|---|---|
| 1 | PR 合并方式:`merge commit` vs `squash` | **`merge commit`**(保 7 个 commit 边界供派生项目参考) |
| 2 | 中间 commit CI 红的接受度 | **接受**(不绕过 required check,只在 commit 7 后等 HEAD 全绿;branch protection 完全不动) |

### 7.2 派生项目 v1 → v2 升级路径(供参考,不在模板 baseline 提供)

派生项目按自身数据量与停机窗口写一次性数据迁移:

1. 部署 v2 代码(包含新 5 表)+ 临时**保留**旧 `User.role` 字段(过渡 schema,本步骤不删字段)
2. 跑数据迁移脚本:遍历每个 user,按旧 `role` 字段创建对应 `UserRole` 记录(`SUPER_ADMIN`→`super_admin` / `ADMIN`→`admin` / `USER`→`user`)
3. 验证业务读写全部走新模型
4. 第二次 migration:删除 `User.role` 字段 + 删除 `Role` enum
5. 强制所有客户端重登(旧 v1 token 因 `typ` / `jti` 字段缺失自动失效)

派生项目写 ADR-NNN 记录本次升级路径,包含迁移脚本与回滚方案。

### 7.3 v2.0 baseline 之外仍走 ADR 的能力

| 能力 | ADR 编号 | 简述 |
|---|---|---|
| CASL / ability 表达式引擎 | B-1(改造) | baseline `Set.has() + *` 已足够;CASL 引入需评估 ROI |
| 部分通配 `user:*` / `*:read` | B-12(新) | baseline 仅 `*` 全权一档 |
| `@AnyPermission(...)` OR | B-13(新) | baseline 仅 AND |
| 数据级 / 行级权限 | B-14(新) | baseline `user:read` 看所有未软删用户 |
| 部门范围权限 / 角色继承(`parentRoleId`) | B-15(新) | baseline 角色平铺 |
| 多租户 / 组织树 | B-2(不变) | baseline 不做 |
| Access token 主动吊销(blacklist) | B-7 残余 | baseline 只吊销 refresh;access 黑名单需 Redis(联动 B-10) |
| 重置密码同步吊销该用户全部 refresh | B-7 残余 | baseline 不做 |
| Refresh token 异常使用全链路吊销(被盗检测,family / reuse detection) | B-7 残余(本 ADR §9 修订点 B) | baseline 仅检测单 token 重放 |
| 本人改密码 `PUT /api/users/me/password` | B-8(保留) | 配套决策多,baseline 仍不做 |
| 微信 / 第三方登录 | B-9(不变) | 不变 |
| 文件上传 / 字典 / 审计 / Redis / LLM | B-3/4/5/6/10/11(不变) | 不变 |

---

## 8. 文档与代码协同(本 ADR 是模板 baseline 决策,不适用"是否回流模板"判定)

本 ADR 是模板仓库自身 baseline 重置,不是派生项目能力解锁。`000-template.md` §8 "是否回流模板" 不适用本 ADR,代之以以下两条:

- **本 ADR 实施分 Phase 0-4 五次 PR**,每次独立 commit、独立 review
- **Phase 0(本 PR)只改文档**:`ARCHITECTURE.md` / `CLAUDE.md` / `AGENTS.md` / `docs/capability-unlock-matrix.md` / `CHANGELOG.md` + 本 ADR;**不动** `src` / `prisma` / `package.json` / migration;**不执行** `prisma migrate`

---

## 9. 修订要点补充(对设计草案的五条精确化)

下列五条是对 §4 设计草案的精确化补充,**Phase 1-3 实现时必须严格遵守**:

### 9.1 修订点 A:JWT payload 新增 `jti`

- v1 `JwtPayload = { sub, username }`
- v2.0 `JwtPayload = { sub, username, typ, jti }`
- **`jti`(JWT ID)是每次签发的唯一标识**,由 `cuid()` 生成
- **refresh token 必须**有 `jti`,且与 `RefreshToken.id` 一一对应(`jti === RefreshToken.id`),便于 rotation 与 logout 通过 jti 精确定位
- **access token 也带 `jti`**,但 baseline 不持久化(为将来 access 黑名单 ADR B-7 残余预留接口,不需要现在做)
- **`typ` 字段**强校验:业务接口仅接受 `typ === 'access'`,refresh 接口仅接受 `typ === 'refresh'`,logout 接口要求 access token(`typ === 'access'`)
- **不在 `jti` 之外塞任何 PII 或权限信息**

### 9.2 修订点 B:baseline 不建 refresh token family 模型

- 不为每次 rotation 建立"family"血缘链(`parentTokenId` / `familyId`)
- 不实现"reuse detection 异常重放全链路吊销"(检测到旧 token 重放就吊销该 family 全部 token)
- 这两条是 OAuth 2.0 best practice 的 advanced 项,**baseline 之外,走 ADR B-7 残余解锁**
- baseline 的处理:已 `revokedAt` 的 token 再次被使用 → 抛 `UNAUTHORIZED`,**不**联动吊销该用户其它 refresh token;攻击者拿到旧 refresh token 重放最多触发一次拒绝,不会清场
- **理由**:family 模型需要额外字段、额外索引、额外回收逻辑,与 baseline "最小可用"原则不符;真有"防 refresh token 盗用"诉求,走 B-7 残余解锁,此时往往会一并引入 Redis(B-10)做 token 撤销列表

### 9.3 修订点 C:logout 语义固定

- **`POST /api/auth/logout`** 要求:
  1. 必须带有效的 **access token**(走 `JwtAuthGuard`,失败抛 `UNAUTHORIZED`)
  2. 必须在 body 提交 `{ refreshToken: string }`(refresh token 明文,服务端 sha256 后比对)
- **服务端只吊销当前 `currentUser.id` 对应的、且 `tokenHash` 匹配的那条 RefreshToken**(`revokedAt = now()`)
- **不允许吊销别人的 refresh token**:即使 refreshToken 字面值能在表里查到,但 `userId !== currentUser.id` 时一律拒绝,抛 `UNAUTHORIZED`(防恶意吊销 / 攻击者拿到他人 refresh 后用自己的 access 调 logout)
- **access token 在剩余 TTL 内仍可用**:baseline 不做 access 黑名单,前端清掉本地存储即可
- **找不到匹配的 refresh token**(可能已过期清理 / 已 rotation / 不属于当前用户):统一返回 `{ status: 'ok' }`,**不暴露**"是否找到"信息(避免被用作账号枚举)

### 9.4 修订点 D:roleCodes 默认 `['user']` + 防权限提升

- `POST /api/users` 入参 `{ roleCodes?: string[] }`,**缺省默认 `['user']`**
- 若调用方**显式传入非 `['user']`** 的值(任何含其它 role.code 的数组,包括 `['user', 'admin']` 或 `['admin']`),**必须拥有 `user_role:assign` 权限**,否则抛 `BizException(BizCode.FORBIDDEN_ROLE_OPERATION)`
- 单纯拥有 `user:write` 只允许创建默认 `user` 角色用户,**不能**通过创建接口绕过 `user_role:assign` 给新用户分配高权限角色(防权限提升攻击)
- 即使拥有 `user_role:assign`,super_admin 角色的分配仍受 §4.5 五条铁律约束(第 1/2 条:只有已有 super_admin 才能分配 super_admin)
- **不要**通过 controller 层 `@Permissions('user:write', 'user_role:assign')` 解决——那样会让"只创建默认 user 角色用户"也需要 `user_role:assign`,违背最小权限。服务层动态判断更合适

### 9.5 修订点 E:`@Public` 与 `@Permissions` 互斥测试

- 永久红线第 8 条:`@Public()` 与 `@Permissions(...)` 互斥
- baseline 实现侧:Guard 层 `@Public` 优先,标了 `@Public` 即跳过 `PermissionsGuard`
- **必须有 E2E 测试用例守护此不变式**,放在 Phase 3 实现:
  - 测试用例:为测试目的临时新增一个 controller 方法同时标 `@Public()` 和 `@Permissions('user:read')`(或单测断言),**编译期或启动期或运行期至少一处**必须能检测出冲突并报错
  - **baseline 建议**:启动期校验(扫描全部路由,发现同时标两个装饰器即抛错退出),实现细节由 Phase 2.1 评估
  - E2E 用例至少覆盖:`@Public` only 路径 / `@Permissions` only 路径 / 未标任一装饰器路径(仅要求登录)
- **不允许**只靠 code review 守护此规则——必须有自动化测试

---

## 10. 验收门槛(Phase 0 本 PR)

本 ADR 所在 Phase 0 PR 的验收门槛:

| 门槛 | 通过标准 |
|---|---|
| 仅文档变更 | `git diff --name-only` 列表中**无** `src/**` / `prisma/**` / `package.json` / `pnpm-lock.yaml` / `.github/**` 路径 |
| 未运行 prisma 命令 | 工作目录 `prisma/migrations/` 无新增目录,无 `prisma generate` 副作用文件 |
| 文档表述无残留 | `grep -ri "v2.0 不做 RBAC\|v2.0 禁止 refresh\|v2.0 禁止 logout"` 全仓库无命中(本 ADR / CHANGELOG 内"v1 历史限制"类引用不计) |
| 文档引用一致 | ADR-001 在 ARCHITECTURE.md / CLAUDE.md / AGENTS.md / capability-matrix / CHANGELOG 至少各被引用一次 |
| ADR 状态 | 初始为 `Proposed`;合并 PR 时改 `Accepted`,日期回填 PR 合并日 |

Phase 0 完成后**才能**进入 Phase 1(`prisma migrate dev --name v2_init_rbac_and_auth`)。

---

## 11. 状态变迁

- 2026-05-18:Proposed(本 PR 提交)
- 2026-05-18:**Accepted**(Phase 0 PR 最终收尾;经 Phase 1 可行性核查后,§7.1A "Phase 1+2+3 合并实施策略" 已并入本 ADR;Phase 0 验收门槛 §10 全部通过)
- _后续_:Phase 1-4 完成后,本 ADR 不动;若 v2.0 之后出现 v3 baseline 升级,本 ADR 标记 `Superseded by ADR-NNN`,原文不删
