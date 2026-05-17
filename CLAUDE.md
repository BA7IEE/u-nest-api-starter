# CLAUDE.md — Claude Code 项目协作铁律(v1 + v2.0 baseline)

> 给 **Claude Code** 看的项目工作铁律,从 `ARCHITECTURE.md` §7 与附录抽取。
> 修改本仓库代码前必须读完:`ARCHITECTURE.md`(v1 蓝图 + v2.0 baseline)+ `CLAUDE.md` + `AGENTS.md` + [`docs/adr/ADR-001-v2-rbac-auth-baseline.md`](./docs/adr/ADR-001-v2-rbac-auth-baseline.md)。
> 如本文与 `ARCHITECTURE.md` 表述冲突,**以 `ARCHITECTURE.md` 为准**;v1 / v2.0 表述冲突时,**以 ADR-001 与 ARCHITECTURE.md §12 为准**。
> 除非用户明确要求,AI 不得修改 `ARCHITECTURE.md`;实现过程中发现文档与代码冲突时,必须先暂停并说明。

---

> **🚨 v2.0 baseline 升级公告**(2026-05-18 立项,当前位于 Phase 0)
>
> v2.0 是模板自身 baseline 重置:
> - **RBAC**(`User → Role → Permission` 四表)— **v2.0 baseline 必备能力**,不再是 v1 阶段的"不做"
> - **Refresh token + logout + rotation** — **v2.0 baseline 必备能力**,不再是 v1 阶段的"不做"
> - **三档红线分级**:永久红线(`docs/capability-unlock-matrix.md` §A,扩展至 29 条)/ v2.0 baseline 能力(本文与 `ARCHITECTURE.md` §12)/ 派生项目 ADR 解锁能力(`docs/capability-unlock-matrix.md` §B)
> - **当前 Phase 0 只改文档**,不动 `src` / `prisma/schema.prisma` / `package.json`;不创建 migration;Phase 1 才落地代码与 schema
> - **v1 历史限制(本文 §1 / §13 / §17 等的"不做 RBAC / 不做 refresh token"表述)不再继续约束 v2.0**,只作为 v1.x 维护分支参考
>
> 设计权威依据:[`docs/adr/ADR-001-v2-rbac-auth-baseline.md`](./docs/adr/ADR-001-v2-rbac-auth-baseline.md)

---

## 派生项目快速指引(若当前仓库是派生项目)

**判断当前仓库类别**(Claude Code 启动时主动判断):

- `package.json#name` 是 `u-nest-api-starter` → **模板仓库**(本指引不适用,正文铁律严格生效)
- `package.json#name` 不是 `u-nest-api-starter` → **派生项目**(本指引生效)
- `README.md` 顶部含 "Template baseline: ..." + "template-freeze mode" 字样 → **模板仓库**

**派生项目里读本文铁律的方式**:

1. 本文 §1 列出的"v1 不做"清单,在派生项目里**按下方四类标签解读**:
   - `[A]` — 永久铁律,派生项目也不做(无法解锁,任何 ADR 都不能削弱)
   - `[B]` — 默认禁止,可通过 ADR 解锁(走流程后可做)
   - `[C]` — 派生项目正常业务能力(直接做,守 A 类铁律即可)
   - `[D]` — 表述过死,按 [`docs/capability-unlock-matrix.md`](./docs/capability-unlock-matrix.md) §D 的"派生项目如何读"行动
2. 触碰 `[B]` / `[C]` / `[D]` 时,**不要直接拒绝**,也不要直接动代码:
   - `[B]` → 先查 `docs/adr/`,有 ADR 按 ADR 实施,无 ADR 暂停引导用户写
   - `[C]` → 直接实施,守 A 类铁律
   - `[D]` → 按矩阵对照表
3. 触碰 `[A]` 时,**必须拒绝**并向用户说明铁律来源,引导寻找不破坏铁律的替代方案

**派生项目对继承文档的修改规则**:

- 派生项目**默认不删改** `ARCHITECTURE.md` / `CLAUDE.md` / `AGENTS.md` 继承段落
- **优先**通过追加"派生项目专属规则"覆盖(在文档底部新增章节)
- 如确需修改继承段落,**必须先有 ADR**(状态 Accepted),并在被修改段落旁加 `<!-- 派生项目自定义,见 ADR-NNN -->` 注释
- **无论如何**不得删除或削弱 A 类永久铁律(完整 27 条清单见 [`docs/capability-unlock-matrix.md`](./docs/capability-unlock-matrix.md) §A)

**派生项目治理细则**:

- [`docs/derived-project-governance.md`](./docs/derived-project-governance.md) — 治理总则、ADR 流程、AI 决策路径
- [`docs/capability-unlock-matrix.md`](./docs/capability-unlock-matrix.md) — 11 项 B 类能力的解锁条件与影响范围

**§17 V1.1 执行约束 在派生项目里不适用**(V1.1 是模板自身工程加固阶段,已收尾,历史任务清单见 [`docs/release-tasks/v1.1-engineering-hardening.md`](./docs/release-tasks/v1.1-engineering-hardening.md))。派生项目跳过 §17。

---

## 0. 修改代码前必读

- AI 新会话可先扫 [`docs/ai-entrypoint.md`](./docs/ai-entrypoint.md),用于判断当前仓库类型与本次任务应读文档;它只是导航页,**不是新的规则来源**
- 必读三件套:`ARCHITECTURE.md` / `CLAUDE.md` / `AGENTS.md`
- 任何不在 v1 范围内的新增功能(见 §1),**必须先暂停并说明原因,不得擅自实现**
- 执行 `prisma migrate dev` 前必须先说明将生成 / 执行的迁移内容并等待确认;生产环境只允许 `prisma migrate deploy` 已审查 migration
- **pnpm-only**:依赖安装与脚本执行统一使用 `pnpm`,禁止 `npm` / `yarn` / `bun`,避免 lockfile 漂移
- `@nestjs/swagger` 必须按其 `peerDependencies` 选择与当前 NestJS 主版本兼容的版本,**禁止手动钉死主版本号**(如硬写 `^7.x`),否则会出现 peer 警告并隐藏 schema bug
- 每次只实现一个阶段,不跨阶段提前写;每个阶段完成后必须 lint / typecheck / test,或至少启动服务验证

---

## 1. v1 不做的事(分四类解读)

> 升级触发条件见 `ARCHITECTURE.md` §9。本节按"红线三档"重新分类:
>
> | 标签 | 含义 |
> |---|---|
> | `[A]` | **永久红线**,任何 ADR / 派生项目 / v2.x 后续版本都不能削弱 |
> | `[BL]` | **v2.0 baseline 已升级**(原 `[B]` 派生项目 ADR 解锁项,v2.0 升级为模板必备能力) |
> | `[B]` | **默认禁止,派生项目可通过 ADR 解锁**(走 [`docs/capability-unlock-matrix.md`](./docs/capability-unlock-matrix.md) §B 流程) |
> | `[C]` | **派生项目正常业务能力**(无需 ADR,守 A 类铁律即可) |
> | `[D]` | **表述过死**,按 [`docs/capability-unlock-matrix.md`](./docs/capability-unlock-matrix.md) §D 行动 |
>
> **在模板仓库**:`[A]` 严格生效;`[BL]` 是 v2.0 baseline 必须做的能力(详见 [`docs/adr/ADR-001-v2-rbac-auth-baseline.md`](./docs/adr/ADR-001-v2-rbac-auth-baseline.md));`[B]` 仍是硬禁止;Phase 0 当前阶段 `[BL]` 项**只允许改文档**,不动 src / prisma。
> **在派生项目**:`[BL]` 在派生项目里属于"已通过模板提供"的 baseline 能力;`[B]` 走 ADR 解锁。

- `[BL]` **RBAC**(`User → Role → Permission` 四表 + `@Permissions` + `PermissionsGuard`)— **v2.0 baseline 必备能力**,见 [`docs/adr/ADR-001-v2-rbac-auth-baseline.md`](./docs/adr/ADR-001-v2-rbac-auth-baseline.md) §4。v1 历史阶段的"不做 RBAC + 三层 Role 不算 RBAC"表述**不再适用 v2.0**(原 B-1 已退役为 baseline)
- `[BL]` **Refresh token + logout + rotation**(短 TTL access + 长 TTL refresh + 哈希存储 + rotation 强制 + 单 session logout)— **v2.0 baseline 必备能力**,见 ADR-001 §4.7。v1 历史阶段的"不做刷新 token"表述**不再适用 v2.0**(原 B-7 主体已退役为 baseline,B-7 残余:access token 主动吊销 / 异常 refresh 全链路吊销 仍走 ADR)
- `[B]` 不做文件上传具体实现(本地 / OSS / R2)(派生项目按 ADR 解锁,见矩阵 B-3 / B-4)
- `[B]` 不做 Redis / 队列 / 定时任务(派生项目按 ADR 解锁,见矩阵 B-10)
- `[B]` 不做注册接口、**本人改密码接口** `PUT /api/users/me/password`(派生项目按 ADR 解锁,见矩阵 B-8;**v2.0 baseline 仍不做本人改密码**,配套决策多见 ADR-001 §7.3)
- `[B]` 不做微信小程序登录、多租户、组织树(派生项目按 ADR 解锁,见矩阵 B-2 / B-9)
- `[B]` 不做 LLM / 向量检索——`modules/ai/` 只放 `README.md` 占位(派生项目按 ADR 解锁,见矩阵 B-11)
- `[B]` 不做操作日志 / 登录日志、字典管理(派生项目按 ADR 解锁,见矩阵 B-5 / B-6)
- `[B]` 不做部分通配权限(`user:*` / `*:read`)、`@AnyPermission` OR 语义、数据级 / 行级权限、角色继承 / 部门范围权限(派生项目按 ADR 解锁,见矩阵 B-12 / B-13 / B-14 / B-15)
- `[B]` 不做 access token 主动吊销(blacklist)、异常 refresh token 全链路吊销(token family / reuse detection)(派生项目按 ADR 解锁,见矩阵 B-7 残余)
- `[D]` 不引入 `LocalStrategy`——`username + password` 校验在 `auth.service.ts` 内手写(派生项目如要多策略,新增 strategy 放 `strategies/`,**不必**为已有 `username + password` 路径引入 LocalStrategy)
- `[A]` **永久铁律**:不创建 `*.entity.ts`——本项目不是 TypeORM 项目
- `[A]` **永久铁律**:不使用 Prisma 全局软删除中间件 / client extension
- `[A]` **永久铁律(v2.0 新增)**:权限 code 是代码契约,**不进字典表**,后台无 create/update/delete 接口
- `[A]` **永久铁律(v2.0 新增)**:权限 code 命名统一 `<resource>:<action>` 两段式,**不允许任何"唯一例外"**(`user_role:assign` 把 user_role 当虚拟资源,不是三段式)
- `[A]` **永久铁律(v2.0 新增)**:refresh token 哈希存储(sha256),不存明文;rotation 时旧 token 立即 `revokedAt`
- `[A]` **永久铁律(v2.0 新增)**:`JwtPayload` 不塞 `roles` / `permissions` / 完整用户对象;权限判定走本次查库(v1 "不塞 role" 的语义升级,实质不变)
- `[D]` 不主动加用户状态缓存"优化"(未触发 `ARCHITECTURE.md` §9 升级条件前不加,触发后按 §9 + 写 ADR,见矩阵 B-10)
- `[B]` 不预先做 storage Provider——`common/storage/` 只放 interface 与 types,**不需要 `.module.ts`**(派生项目按 ADR 解锁,见矩阵 B-3)

**完整 A 类永久铁律清单见** [`docs/capability-unlock-matrix.md`](./docs/capability-unlock-matrix.md) **§A,共 29 条**(v2.0 扩展自 v1 的 27 条,新增权限码命名 + refresh 哈希存储两条相关红线)。

**C 类派生项目正常业务**(无需 ADR,守 A 类铁律即可):新增业务模块、新增业务 Prisma model、`User` 加普通业务字段、新增业务 DTO / Service / Controller、新增业务 BizCode、新增 E2E / contract 测试、新增业务专属 docs。详见 [`docs/capability-unlock-matrix.md`](./docs/capability-unlock-matrix.md) §C。

---

## 2. 模块结构

业务模块固定 4 文件:

```
modules/<name>/
├── <name>.module.ts
├── <name>.controller.ts
├── <name>.service.ts
└── <name>.dto.ts
```

- 例外:`health/` 只有 `health.module.ts` + `health.controller.ts`
- 单个 dto 文件超 300 行,允许拆同模块内 `dto/` 目录,**禁止跨模块公共目录**
- 禁止 `*.entity.ts`

新业务模块平铺加在 `src/modules/` 下,**不要嵌套** `system/` 子目录。

---

## 3. 命名铁律

| 场景 | 错误 | 正确 |
|---|---|---|
| 密码字段 | `password`(model / response DTO) | `passwordHash`(仅 Prisma model 与 service 内部) |
| 文件标识 | `path` / `filename` / `url` | `key` |
| 角色判断 | `if (user.role === 'admin')` | `if (user.role === Role.ADMIN)` |
| 角色装饰器 | `@Roles('admin')` | `@Roles(Role.SUPER_ADMIN, Role.ADMIN)` |
| 错误抛出 | `throw new Error('用户不存在')` | `throw new BizException(BizCode.USER_NOT_FOUND)` |
| 时间字段 | `create_time` / `createTime` | `createdAt` |
| 主键 | 自增 int | `cuid()` 字符串 |
| 角色 / 状态枚举 | 手写 `users.enum.ts` | 从 `@prisma/client` 导入 `Role` / `UserStatus` |

`Role` / `UserStatus` 唯一来源是 Prisma schema:

```typescript
import { Role, UserStatus } from '@prisma/client';
```

### 字段校验铁律(DTO 层硬约束)

| 字段 | 入参 DTO 校验 | 入库前归一化 |
|---|---|---|
| `username` | `@Matches(/^[a-z0-9_-]{3,32}$/)`(小写字母+数字+下划线+中横线,3-32) | `trim()` + `toLowerCase()` |
| `email` | `@IsOptional()` + `@IsEmail()` | `trim()` + `toLowerCase()`;空字符串按未填写处理(写入前置 `null`,**不要**写空字符串入库) |
| `password` / `newPassword` | `@MinLength(8)`,必须含数字 + 字母 | 落库前必须 `bcrypt.hash()`,绝不裸传 Prisma |
| `nickname` | `@MaxLength(50)` | — |
| `avatarKey` | `@MaxLength(255)` | — |

`username` / `email` 的 `trim()` + `toLowerCase()` 必须在**入库前**和**所有查询前**统一执行,避免大小写账号或首尾空格账号并存(`Admin` 与 `admin` 同账号)。

---

## 4. 统一返回格式

所有接口经 `ResponseInterceptor` 包装为 `{ code: 0, message: 'ok', data }`。业务代码**只 `return data`**,永远不要手动包外层结构。

### 分页

入参固定使用 `PaginationQueryDto`,`page` / `pageSize` 命名固定,默认 `page=1` / `pageSize=20`,`pageSize` 最大 100。**禁止 `limit/offset` / `skip/take` / `cursor`**。Prisma 查询时换算 `skip = (page - 1) * pageSize`,`take = pageSize`。

出参固定 `PageResultDto<T>`(`items` / `total` / `page` / `pageSize`),禁止 `{ list, count }` / `{ rows, total }` 等变体。默认排序 `orderBy: { createdAt: 'desc' }`。

### `ResponseInterceptor` 跳过路径

用 `startsWith` 匹配以下前缀,匹配则不动响应体:

- `/api/docs`(自动覆盖 `/api/docs-json` / `/api/docs-yaml`)
- `/favicon.ico`
- `/metrics`
- 文件下载流响应

**铁律:Swagger UI 与 OpenAPI JSON/YAML 永远不能被业务响应包装。** 实现完成后必须实际访问 `/api/docs` 与 `/api/docs-json` 验收。

`/api/health` **走包装**,不在跳过列表;controller 返回 `{ status: 'ok' }`,最终响应 `{ code: 0, message: 'ok', data: { status: 'ok' } }`。

---

## 5. 错误处理

### `BizCode` 三字段对象

集中维护在 `common/exceptions/biz-code.constant.ts`,**每个 BizCode 必须同时携带 `code` / `message` / `httpStatus`**:

```typescript
import { HttpStatus } from '@nestjs/common';

export const BizCode = {
  BAD_REQUEST:    { code: 40000, message: '请求参数错误',   httpStatus: HttpStatus.BAD_REQUEST },
  UNAUTHORIZED:   { code: 40100, message: '未登录或登录已失效', httpStatus: HttpStatus.UNAUTHORIZED },
  FORBIDDEN:      { code: 40300, message: '无权限访问',     httpStatus: HttpStatus.FORBIDDEN },
  NOT_FOUND:      { code: 40400, message: '资源不存在',     httpStatus: HttpStatus.NOT_FOUND },
  INTERNAL_ERROR: { code: 50000, message: '服务器内部错误', httpStatus: HttpStatus.INTERNAL_SERVER_ERROR },

  USER_NOT_FOUND:           { code: 10001, message: '用户不存在',     httpStatus: HttpStatus.NOT_FOUND },
  USERNAME_ALREADY_EXISTS:  { code: 10002, message: 'username 已存在', httpStatus: HttpStatus.CONFLICT },
  EMAIL_ALREADY_EXISTS:     { code: 10003, message: 'email 已存在',    httpStatus: HttpStatus.CONFLICT },
  LOGIN_FAILED:             { code: 10004, message: '账号或密码错误',  httpStatus: HttpStatus.UNAUTHORIZED },
  FORBIDDEN_ROLE_OPERATION: { code: 10101, message: '无权对该用户执行此操作', httpStatus: HttpStatus.FORBIDDEN },
  CANNOT_OPERATE_SELF:      { code: 10102, message: '不能对自己执行此操作',   httpStatus: HttpStatus.FORBIDDEN },
  LAST_SUPER_ADMIN_PROTECTED:{ code: 10103, message: '系统必须保留至少一个活跃超级管理员', httpStatus: HttpStatus.CONFLICT },
} as const;
```

### `BizException` 类型签名锁死

构造参数类型必须为 BizCode 联合类型,**不接收裸数字 / 字符串 / 临时对象**:

```typescript
type BizCodeEntry = (typeof BizCode)[keyof typeof BizCode];

export class BizException extends Error {
  constructor(public readonly biz: BizCodeEntry) {
    super(biz.message);
  }
}

throw new BizException(BizCode.USER_NOT_FOUND);  // ✓
throw new BizException(10001);                    // ✗
throw new BizException('USER_ERROR');             // ✗
throw new BizException({ code: 10099, ... });     // ✗ 临时对象禁止
```

### `AllExceptionsFilter` 处理规则

- `BizException` → 读 `httpStatus`,响应 `{ code, message, data: null }` + 对应 HTTP status
- NestJS `HttpException` → 沿用其 HTTP status,`code` 用通用 BizCode(`BAD_REQUEST` / `UNAUTHORIZED` / `FORBIDDEN` / `NOT_FOUND` / `INTERNAL_ERROR`)
- 未知异常 → HTTP 500,`code` 为 `INTERNAL_ERROR`,生产环境不暴露 `error.message`

业务响应体始终 `{ code, message, data }` 三字段;HTTP status 始终保持语义。**禁止为了"统一"返回 HTTP 200。**

### BizCode 编码段

- `4xxxx` / `5xxxx`:**通用 HTTP 级错误**,与 HTTP status 段对齐(未登录 / 无权限 / 资源不存在 / 服务器错误)
- `100xx`:`users` 模块**业务级错误**(包含 `auth`,**`auth` 不单开段**;如登录失败 `LOGIN_FAILED=10004`、用户名 / 邮箱冲突)
- `101xx`:`users` 权限 / 操作边界错误
- `110xx`+:后续业务模块按 `orgs:110xx/111xx` / `missions:120xx/121xx` 平铺,每模块 200 个号段

**通用 token / 鉴权失败统一复用 `UNAUTHORIZED=40100`,不另起编号**:`JwtStrategy.validate()` 中 token 无效 / 已过期 / 用户被禁 / 用户被软删全部抛 `UNAUTHORIZED`。这类是 HTTP 401 通用语义,不是业务级错误;AI **禁止**为 `TOKEN_INVALID` / `TOKEN_EXPIRED` 之类自创 `100xx` 业务码。只有真出现 refresh token 这类需细分原因(`REFRESH_TOKEN_EXPIRED` vs `REFRESH_TOKEN_REVOKED`)的需求时,才在 `100xx` 段新增。

新增 BizCode 必须先说明使用场景与前端提示价值,确认后加入,显式声明 `httpStatus`。

### Prisma 错误转换

`P2002` 唯一约束错误必须显式捕获 `PrismaClientKnownRequestError`,根据 `error.meta?.target` 转为对应 `BizException`(`USERNAME_ALREADY_EXISTS` / `EMAIL_ALREADY_EXISTS`),不要丢给全局过滤器兜底。

**注意 `error.meta?.target` 是 `string[]` 而非 `string`**,判断时必须用数组方法:

```typescript
import { Prisma } from '@prisma/client';

try {
  await this.prisma.user.create({ data });
} catch (err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    const target = (err.meta?.target as string[] | undefined) ?? [];
    if (target.includes('username')) throw new BizException(BizCode.USERNAME_ALREADY_EXISTS);
    if (target.includes('email'))    throw new BizException(BizCode.EMAIL_ALREADY_EXISTS);
  }
  throw err;
}
```

禁止写 `target === 'username'`,在多列复合唯一约束场景会漏判。

---

## 6. Swagger 100% 覆盖

- 每个 Controller 方法必须 `@ApiOperation({ summary })`
- 每个 DTO 字段必须 `@ApiProperty({ description })`
- 需鉴权方法必须 `@ApiBearerAuth()`
- 响应类型按返回结构选用,**禁止裸写** `@ApiOkResponse({ type: Dto })`:
  - 单对象:`@ApiWrappedOkResponse(Dto)`
  - 数组:`@ApiWrappedArrayResponse(Dto)`
  - **分页:`@ApiWrappedPageResponse(Dto)`**(必须用此装饰器)
- 三个装饰器集中放在 `common/decorators/api-response.decorator.ts`
- `PageResultDto<T>` 是 TS 泛型,`@nestjs/swagger` 无法 reflect 泛型参数,因此分页接口**必须**用 `@ApiWrappedPageResponse(Dto)`,装饰器内部用 `getSchemaPath(Dto)` + `allOf` 显式描述 `data: { items, total, page, pageSize }`,否则前端 SDK 生成器拿到的是单对象 schema。需要在 controller 类上配套 `@ApiExtraModels(Dto, PageResultDto)`

---

## 7. 全局 ValidationPipe

`main.ts` 注册全局:

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

- `forbidNonWhitelisted` 保证 DTO 未声明字段直接报错
- 禁止 controller 重复配置局部 `ValidationPipe`

---

## 8. 权限与鉴权

> **v2.0 baseline 升级提示**:本节描述 v1 的 `RolesGuard + @Roles + JwtPayload {sub,username}` 模型。v2.0 baseline 已升级为:
> - `JwtAuthGuard` + **`PermissionsGuard`**(替换 `RolesGuard`),全局注册顺序不变(`JwtAuthGuard → PermissionsGuard`)
> - `@Public()` 与 **`@Permissions(...)`** 互斥(替换 `@Roles`)
> - `JwtPayload` 扩展为 `{ sub, username, typ: 'access' | 'refresh', jti }`,**不塞 `roles` / `permissions`**(语义升级)
> - `CurrentUserPayload` 扩展为 `{ id, username, status, roles: string[], permissions: Set<string> }`,删除 `role: Role` 字段
> - 新增 `POST /api/auth/refresh` / `POST /api/auth/logout` 接口
> - logout 语义固定:要求 access token 登录 + 提交 `{ refreshToken }`,只吊销当前用户对应的该条(详见 ADR-001 §9.3)
>
> 详见 [`docs/adr/ADR-001-v2-rbac-auth-baseline.md`](./docs/adr/ADR-001-v2-rbac-auth-baseline.md) §4.6 / §4.7 / §9.1 / §9.3。本节下方原文保留供 v1.x 维护分支参考。

### Guard 全局注册

`JwtAuthGuard` + `RolesGuard` 通过 `AppModule.providers` 中 `APP_GUARD` 全局注册,顺序固定 `JwtAuthGuard` → `RolesGuard`(先验登录,再验角色)。**禁止在 controller 上 `@UseGuards(...)`**。<!-- v1 历史声明;v2.0 替换为 PermissionsGuard,见本节顶部 v2.0 提示 -->

```typescript
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: RolesGuard },
]
```

### `@Public()` / `@Roles(...)` 互斥

- 未标 `@Public()` 默认要登录
- `@Public()` 与 `@Roles(...)` 互斥
- `RolesGuard` 看到 `@Roles(...)` 但 `request.user` 为空 → **拒绝访问**(抛 `BizException(BizCode.UNAUTHORIZED)`),不要因没拿到 user 就放行

### `JwtAuthGuard` 通过 `Reflector` 识别 `@Public()`

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) { super(); }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

`@Public()` 装饰器使用 `SetMetadata(IS_PUBLIC_KEY, true)`,常量与装饰器同文件导出。

### 登录

- v1 入参固定 `username + password`(不支持 email / 手机号 / 验证码登录)
- `username` 入库与查询前统一 `trim()` + `toLowerCase()`
- 校验在 `auth.service.ts` 内手写:`findFirst` → `bcrypt.compare` → `JwtService.sign`
- **不引入 `LocalStrategy`**
- 登录成功后**顺手更新** `lastLoginAt = new Date()`;更新失败只 `logger.warn`,**不阻断登录响应**(避免一次写库失败把登录链路挂掉);v1 不做 `login_logs` 表
- `userSafeSelect` 与 `UserResponseDto` 必须包含 `lastLoginAt` 字段,管理后台用于查看账号活跃度

### 登录失败防账号枚举

四场景统一抛 `BizException(BizCode.LOGIN_FAILED)`,响应 `{ code: 10004, message: '账号或密码错误', data: null }` + HTTP 401,**完全相同**:

- `username` 不存在
- `password` 错误
- 账号已禁用(`status=DISABLED`)
- 账号已软删除(`deletedAt != null`)

禁止在登录接口区分提示"账号不存在""密码错误""账号被禁用",任何字段差异(包括 message 文案、错误码细分、响应耗时显著差异)都视为枚举漏洞。

**Timing 防御铁律**:`username` 不存在时**也必须**跑一次 `bcrypt.compare(password, dummyHash)`(用一个预先生成、模块级常量化的固定 dummy hash),保证四场景的响应耗时一致。**禁止** `if (!user) throw LoginFailed` 这类早返回——`bcrypt.compare` 是慢操作(~50ms 量级),早返回会让"账号不存在"明显比"密码错误"快几十毫秒,攻击者据此可枚举有效账号(timing oracle 攻击)。

### JwtPayload 最小

```typescript
export interface JwtPayload {
  sub: string;      // user.id
  username: string;
}
```

**不塞 `role`,不塞完整用户对象。**

### 查库唯一位置

`JwtStrategy.validate()` 每次请求根据 `payload.sub` 查库,校验 `deletedAt === null && status === UserStatus.ACTIVE`。校验失败(token 无效 / 已过期 / 用户不存在 / 用户被禁用 / 用户已软删除)统一抛 `BizException(BizCode.UNAUTHORIZED)`。

`validate()` 返回的对象由 passport 自动挂到 `request.user`。`JwtAuthGuard` 不要再写一份查库逻辑。

### 两阶段错误码区分

| 阶段 | 触发位置 | 错误码 | code | message |
|---|---|---|---|---|
| 登录阶段 | `auth.service.ts` 校验 `username + password` 失败 | `LOGIN_FAILED` | 10004 | 账号或密码错误 |
| 已登录请求 | `JwtStrategy.validate()` token / 用户状态失败 | `UNAUTHORIZED` | 40100 | 未登录或登录已失效 |

两者 HTTP status 都是 401,**前端必须按 `code` 区分**(避免管理员重置密码后旧 token 失效被前端当成"登录表单密码错")。

### `CurrentUser` 类型

```typescript
export interface CurrentUser {
  id: string;
  username: string;
  role: Role;
  status: UserStatus;
}
```

**权限判断必须使用本次查库得到的 `role`,不得信任 token payload 中的角色信息。**

### 不主动加缓存"优化"

每请求查库是有意设计:主键索引 sub-millisecond 级,远不是瓶颈;换来"被禁用户即时失效"。升级条件见 `ARCHITECTURE.md` §9(用户校验耗时 >20% 或单表 QPS > 1000 才考虑 Redis 短 TTL 缓存)。

---

## 9. 密码处理铁律

| 出现位置 | `password` | `passwordHash` |
|---|---|---|
| Prisma model | ❌ | ✅ 唯一允许 |
| 响应 DTO | ❌ | ❌ |
| 请求 DTO | ✅ (`password` / `newPassword`) | ❌ |
| service 内部 | ✅(只能从请求 DTO 读取,落库前必须哈希) | ✅ |

- v1 默认 `bcryptjs`,salt rounds 固定 `10`
- 安装:`pnpm add bcryptjs` + 类型 `pnpm add -D @types/bcryptjs`
- 统一 import:`import * as bcrypt from 'bcryptjs'`
- DTO 校验:密码至少 8 位 + 含数字 + 字母
- service 接收 `password` 后**入库前必须** `bcrypt.hash()`,绝不裸传 Prisma
- 响应 DTO 通过 `userSafeSelect` 排除 `passwordHash`,任何接口响应里都不应出现该字段
- `POST /api/users` **必须由调用方传 `password`**,禁止后端生成默认密码或留空
- `PUT /api/users/:id/password` 接收 `ResetUserPasswordDto { newPassword }`,**不需要 `oldPassword`**,但必须走 `assertCanManageUser`
- 管理员重置密码后**不主动吊销旧 token**;如需立即阻断,由管理员把目标用户 `status` 改 `DISABLED`
- **v1 不实现"本人改密码"接口**,不要在其他接口里夹带"顺手改密码"逻辑

---

## 10. 软删除

不使用 Prisma 全局软删除中间件。在 `users.service.ts` 内封装:

```typescript
private notDeletedWhere<T extends object>(where: T = {} as T) {
  return { ...where, deletedAt: null };
}
```

- **禁止** `prisma.user.delete()`,删除走 `update({ deletedAt: new Date(), status: UserStatus.DISABLED })`
- 所有非"管理员看回收站"查询经 `notDeletedWhere()` 过滤
- 业务详情查询禁用 `prisma.user.findUnique()`,统一 `findFirst({ where: notDeletedWhere(...) })`
- `seed` / 创建 / 更新用户的 `username` / `email` 唯一性预检查**必须**用 `findUnique`(包含软删记录),**禁止**用 `findFirst + notDeletedWhere`——软删后 `username` / `email` 不复用,唯一性预检查的目的就是检测包含软删在内的全部占用;若用 `notDeletedWhere` 过滤,软删占用会通过预检查,落库时撞 unique index 报 P2002,前端拿到一个本可前置友好提示的服务器侧异常
- `findById` 找不到(含已软删)统一抛 `BizException(BizCode.USER_NOT_FOUND)`
- 访问已删除用户的详情 / 修改 / 重置密码 / 改角色 / 改状态 / 删除接口,统一表现为用户不存在
- 登录路径额外校验 `status === ACTIVE`,不只 `deletedAt === null`
- v1 不提供恢复接口

---

## 11. DTO 与 Prisma 类型严格分离

- 入参 DTO 带 `class-validator` 装饰器
- 出参 DTO `UserResponseDto` 显式列出对外字段(永不含 `passwordHash`,**必须包含** `lastLoginAt`)
- Prisma 生成的 `User` 类型仅在 service 内部用,**绝不直接返给 controller / 前端**
- `User` 对外返回必须使用集中定义的 `userSafeSelect`(在 `modules/users/users.select.ts`)
- `UserResponseDto` 与 `userSafeSelect` **必须同步维护**:增删字段时同时改两边
- 禁止 `*.entity.ts`

### 入参 DTO 字段白名单(纵深防御)

`forbidNonWhitelisted: true` 是兜底,DTO 自身白名单是第一道防线;一旦 DTO 多声明一个字段,纵深防御直接破口。

- **`UpdateMyProfileDto`**(`PATCH /api/users/me`):仅允许 `nickname` / `avatarKey`。**禁止**包含 `username` / `email` / `passwordHash` / `role` / `status` / `deletedAt` / `id` / `lastLoginAt` 等任何字段
- **`UpdateUserDto`**(`PATCH /api/users/:id`,管理员改用户资料):**禁止**包含 `role` / `password` / `passwordHash` / `status` / `deletedAt` / `id`。角色修改走 `PATCH /api/users/:id/role`,密码重置走 `PUT /api/users/:id/password`,启用 / 禁用走 `PATCH /api/users/:id/status`,软删除走 `DELETE /api/users/:id`,**绝不在更新资料接口里夹带**
- **`CreateUserDto.role`** 可选,**禁止**直接透传给 Prisma;必须经业务层根据当前用户角色校验后再决定写入值(见 §13)

### `IdParamDto` 字符串校验

```typescript
export class IdParamDto {
  @ApiProperty({ example: 'cl9z3a8b00000abcd1234efgh' })
  @IsString()
  @Length(8, 64, { message: 'id 必须是 8-64 位字符串' })
  id!: string;
}
```

- **禁止** `@Param('id', ParseIntPipe)` / `id: number` / `@IsInt()`
- **禁止**写死 cuid 正则,优先长度校验
- 所有 `:id` 路径参数都通过 `IdParamDto` 校验

---

## 12. 事务

`prisma.$transaction` 必须用于:

- 多个写操作
- 先检查再写入的关键业务
- 管理员保护类操作(删除 / 禁用 / 降级 super admin)

**"检查剩余活跃 super admin 数 + 执行更新" 必须在同一事务内**,避免并发请求破坏"至少一个活跃 super admin"的不变式。

不需要事务:单表只读、单条普通资料更新且不依赖检查结果维护不变式。

---

## 13. 角色层级与管理员保护

> **🚨 v2.0 baseline 升级 — 本节已被 ADR-001 取代**
>
> 本节描述的"三层 `Role` enum + `@Roles` + `RolesGuard`"是 **v1 历史模型**。**v2.0 baseline 已升级为标准 RBAC**(`User → Role → Permission` 四表 + `@Permissions` + `PermissionsGuard`),见 [`docs/adr/ADR-001-v2-rbac-auth-baseline.md`](./docs/adr/ADR-001-v2-rbac-auth-baseline.md) §4。
>
> v2.0 关键替换:
> - 删除 `User.role` 字段,删除 `enum Role`(以 `UserRole` 多对多为权限唯一来源)
> - `@Roles(Role.SUPER_ADMIN, Role.ADMIN)` → `@Permissions('user:read', 'user:write')`(AND 语义)
> - `RolesGuard` → `PermissionsGuard`,全局注册顺序不变
> - **五条 super_admin 铁律**(ADR-001 §4.5)展开自本节"自我保护 + 最后一个 SUPER_ADMIN 保护"
> - **创建用户防权限提升**:`POST /api/users` 缺省 `roleCodes: ['user']`;显式非缺省值需 `user_role:assign`(详见 ADR-001 §9.4)
>
> 本节下方原文保留供 v1.x 维护分支参考,**不再作为 v2.0 baseline 的权威依据**。

层级固定:`SUPER_ADMIN > ADMIN > USER`。三层 Role **不是 RBAC**,不要扩展 permission 表 / `user_roles` 多对多 / `casl`。<!-- v1 历史声明,v2.0 已经升级为 RBAC,见 ADR-001 -->

### 管理边界

- v1 只有 `prisma/seed.ts` 能创建 `SUPER_ADMIN`;业务 API **禁止**创建 `SUPER_ADMIN`
- `SUPER_ADMIN` 业务 API 创建用户只允许 `role=ADMIN | USER`
- `ADMIN` 调用创建接口最终只能创建 `USER`;显式传 `ADMIN` / `SUPER_ADMIN` 抛 `FORBIDDEN_ROLE_OPERATION`
- `ADMIN` 只能管理 `USER`,不能查看 / 修改 / 禁用 / 删除 / 降级 / 创建 `ADMIN` / `SUPER_ADMIN`
- `USER` 只能访问本人接口

### 双层校验

**Guard 管入口,Service 管业务**:

- Guard 层 `@Roles(Role.SUPER_ADMIN, Role.ADMIN)` 只决定谁能进管理接口
- Service 层 `assertCanManageUser(currentUser, targetUser)` 必须按当前角色与目标角色再次校验"能操作谁"

```typescript
private assertCanManageUser(currentUser: CurrentUser, targetUser: User) {
  if (currentUser.role === Role.SUPER_ADMIN) return;
  if (currentUser.role === Role.ADMIN && targetUser.role === Role.USER) return;
  throw new BizException(BizCode.FORBIDDEN_ROLE_OPERATION);
}
```

以下接口必须先 `findFirst` 查出目标用户,再 `assertCanManageUser`:

- `GET /api/users/:id`
- `PATCH /api/users/:id`
- `PUT /api/users/:id/password`
- `PATCH /api/users/:id/role`
- `PATCH /api/users/:id/status`
- `DELETE /api/users/:id`

### 自我保护(防误操作)

`id === currentUser.id` 时拒绝以下操作,抛 `BizException(BizCode.CANNOT_OPERATE_SELF)`:

- `DELETE /api/users/:id`
- `PATCH /api/users/:id/status`(改成 `DISABLED`)
- `PATCH /api/users/:id/role`

`PATCH /api/users/:id` 永远不接受 `role` 字段;角色修改必须走 `PATCH /api/users/:id/role`。

### 最后一个 SUPER_ADMIN 保护(防代码漏洞)

任何"剥夺超级管理员权限"操作前,在同一 `prisma.$transaction` 内查询剩余活跃 super admin 数并执行更新,确保操作后剩余 ≥ 1,否则抛 `BizException(BizCode.LAST_SUPER_ADMIN_PROTECTED)`。

适用接口(当且仅当目标用户当前是 super admin 时检查):

- `DELETE /api/users/:id`
- `PATCH /api/users/:id/status`(改 `DISABLED`)
- `PATCH /api/users/:id/role`(role 改 `ADMIN` 或 `USER`)

### 用户列表可见范围

- `SUPER_ADMIN`:可看 `SUPER_ADMIN` / `ADMIN` / `USER`
- `ADMIN`:只能看 `USER`
- `USER`:不能进入管理列表

### 字段透传安全

`CreateUserDto.role` 可选,不传默认 `USER`,**禁止把 role 从 DTO 直接透传给 Prisma**;必须经业务层根据当前用户角色校验后再决定写入值。

### SUPER_ADMIN 之间互操作(v1 设计选择)

v1 允许 `SUPER_ADMIN` **互相管理**:重置密码、禁用、改角色、软删除均可,仅受**自我保护**和**最后一个 SUPER_ADMIN 保护**两层约束。

| 场景 | v1 行为 | 命中保护 |
|---|---|---|
| `SUPER_ADMIN A` 重置 `SUPER_ADMIN B` 的密码 | ✅ 允许 | 不命中(密码重置不剥夺权限) |
| `SUPER_ADMIN A` 把 `SUPER_ADMIN B` 改成 `DISABLED` | ✅ 允许(剩余活跃 super admin ≥ 1) | 命中最后一个保护 |
| `SUPER_ADMIN A` 把 `SUPER_ADMIN B` 降级为 `ADMIN` / `USER` | ✅ 允许(剩余活跃 super admin ≥ 1) | 命中最后一个保护 |
| `SUPER_ADMIN A` 软删 `SUPER_ADMIN B` | ✅ 允许(剩余活跃 super admin ≥ 1) | 命中最后一个保护 |
| `SUPER_ADMIN A` 对自己执行上述任一操作 | ❌ 拒绝 | 命中自我保护 |

这是 v1 的**明确选择,不是疏漏**:v1 默认只有一个 SUPER_ADMIN(`prisma/seed.ts` 创建),互操作是低频运维场景;若禁止互操作,会出现"前任 SUPER_ADMIN 离职后无法被接任者接管"的死锁。真出现"SUPER_ADMIN 互不可操作"诉求时按 `ARCHITECTURE.md` §9 升级路径处理,**作为权限模型升级**,不是渐进改造。

AI 实施时**不要**凭直觉额外加一层"SUPER_ADMIN 互不可操作"校验,也**不要**在 `assertCanManageUser` 里把 `targetUser.role === Role.SUPER_ADMIN` 列为禁止条件。

---

## 14. 配置文件归属

| 环境变量 | 归属 |
|---|---|
| `APP_PORT` / `APP_ENV` / `APP_CORS_ORIGIN` / `ENABLE_SWAGGER` | `src/config/app.config.ts` |
| `DATABASE_URL` | `src/config/database.config.ts` |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | `src/config/jwt.config.ts` |
| `SUPER_ADMIN_*` | **不进 config**,仅 `prisma/seed.ts` 内 `process.env` 直读 |

- 不为 CORS / Swagger / 单一开关再单建 `cors.config.ts` / `swagger.config.ts`
- 业务代码与 service **不直接 `process.env.XXX`**,统一通过对应 `*.config.ts` 注入(`SUPER_ADMIN_*` 是显式例外)
- 新增环境变量先决定归属,再同步加进 `.env.example` 与启动强校验
- **业务判断只用 `APP_ENV`,禁止混用 `NODE_ENV`** 做业务配置判断;`NODE_ENV` 只留给框架与工具链(NestJS / Prisma / Webpack)内部使用

### 启动强校验铁律

应用启动时必须强校验,任一不满足直接抛错退出,**禁止用 fallback 默认值兜底**:

| 校验项 | 要求 |
|---|---|
| `APP_ENV` | 必须 ∈ `{ development, test, production }` |
| `JWT_SECRET` | 至少 32 字符 |
| `JWT_SECRET`(production) | **不允许**等于 `.env.example` 默认值 `please-change-me-in-production-min-32-chars`;推荐用 `openssl rand -base64 48` 生成 |
| `APP_CORS_ORIGIN`(production) | **禁止**为空,**禁止** `*`,必须显式列出前端域名 |
| `APP_CORS_ORIGIN` 解析 | 支持英文逗号分隔多个 origin,`split(',').map(trim).filter(Boolean)` |
| `ENABLE_SWAGGER` | **必须严格字符串判断 `=== 'true'`**,**禁止** `Boolean(process.env.ENABLE_SWAGGER)` 或 truthy 判断,否则字符串 `'false'` 会被误判为开启 |
| Swagger 开关公式 | `APP_ENV !== 'production' \|\| ENABLE_SWAGGER === 'true'` |

`prisma/seed.ts` 额外强校验:

- `SUPER_ADMIN_USERNAME` 必须符合 username 格式(小写字母+数字+下划线+中横线,3-32)
- `APP_ENV=production` 下**禁止** `SUPER_ADMIN_USERNAME=admin`
- `APP_ENV=production` 下**禁止** `SUPER_ADMIN_PASSWORD=ChangeMe123456`(`.env.example` 默认值)
- `SUPER_ADMIN_USERNAME` 对应用户已存在时,**不覆盖**密码 / 角色 / 邮箱,只打印提示

---

## 15. 实施顺序

按 `ARCHITECTURE.md` 附录执行,逐步推进:

1. 项目初始化(`pnpm` + NestJS CLI + tsconfig / eslint / prettier)
2. Docker Compose 起 PostgreSQL
3. Prisma 接入(schema + 第一次 migration + `PrismaService`)
4. 公共基础件(全局 `/api` 前缀、CORS、异常过滤器、响应拦截器、`BizException`、`@Public` / `@CurrentUser` / `@Roles`)
5. `health/`(`GET /api/health` + `@Public()`)
6. Swagger 接入
7. `auth/` 登录
8. `users/` 模块(本人 + 管理员接口、分页、`userSafeSelect`、`notDeletedWhere`、自我保护 + 最后一个 SUPER_ADMIN 保护)
9. `prisma/seed.ts`
10. `common/storage/` 接口落地(只 interface + types,不实现 Provider)
11. `modules/ai/README.md` 占位
12. `CLAUDE.md` + `AGENTS.md`(本文件)
13. `README.md`

---

## 16. 测试策略

- v1 初始搭建不强制 E2E,不阻塞骨架
- `auth` / `users` 稳定后优先引入 E2E
- E2E 必须断言统一响应格式;错误响应必须**同时断言 HTTP status code 与 `BizCode.httpStatus` 一致**
- 登录失败必须覆盖**防账号枚举四场景**(`username` 不存在 / `password` 错 / 已禁用 / 已软删除),响应体与 HTTP status 完全相同
- E2E 优先覆盖:登录、JWT 鉴权、用户 CRUD、角色边界、软删除、禁用用户、最后一个 SUPER_ADMIN 保护、唯一约束冲突

---

## 17. Claude Code V1.1 执行约束

> **v2.0 baseline 升级提示**:V1.1 是模板自身工程加固阶段(已收尾)。**V1.1 阶段的"不引入 RBAC / 不引入 refresh token"约束属于 V1.1 历史范畴,不适用 v2.0 baseline**(v2.0 已升级,见 §18 与 [`docs/adr/ADR-001-v2-rbac-auth-baseline.md`](./docs/adr/ADR-001-v2-rbac-auth-baseline.md))。本节正文保留供 V1.1 历史脉络参考。

> 本节是 Claude Code 在 V1.1 工程加固阶段的特定执行约束,与 `ARCHITECTURE.md` §11 / `AGENTS.md` §17 同步。
> Claude Code 修改 V1.1 相关代码前,**必须**:
> 1. 读完 `ARCHITECTURE.md` §11(V1.1 范围与禁止项)
> 2. 读完历史任务清单 [`docs/release-tasks/v1.1-engineering-hardening.md`](./docs/release-tasks/v1.1-engineering-hardening.md)
> 3. 找到当前任务在 `<v1.1 任务清单>` 的编号,确认前置任务已完成
> V1.1 与 v1 铁律冲突时,**以 v1 铁律为准**(§1-§16 全部保留生效)。
>
> **路径迁移说明**:V1.1 阶段任务清单原路径为仓库根 `<v1.1 任务清单>`,v0.1.7 起归档至 `docs/release-tasks/v1.1-engineering-hardening.md`。本节中后续以 `<v1.1 任务清单>` 简称指代该归档文件;代码内保留的 `// V1.1 TASKS.md 15.x` 等历史注释按此对应,无需改写代码。

### 17.1 V1.1 范围一句话总结

只做三件事:**结构化日志 + 请求 ID 追踪、Dockerfile + CI + 优雅关闭 + 健康检查分层、helmet + 登录限流**。其它一切诉求(Redis、APM、Tracing、Metrics、RBAC、refresh token、文件上传、LLM)在 V1.1 阶段**仍然不做**,触发条件见 `ARCHITECTURE.md` §9。

### 17.2 V1.1 必须使用的选型

| 能力 | 必须使用 | 不允许的替代 |
|---|---|---|
| 结构化日志 | `nestjs-pino` + `pino`(开发可叠 `pino-pretty`) | `winston` / `bunyan` / 自写 logger / `console.log` |
| 限流 | `@nestjs/throttler` 内存 storage | Redis storage / 自写 rate limiter / `setTimeout` 伪限流 |
| 安全头 | `helmet` | 自写头中间件 / 仅靠 CORS |
| 健康检查升级 | `@nestjs/terminus`(`PrismaHealthIndicator` 或等价 `SELECT 1`) | 自写 controller / 在业务模块内查 DB |
| 优雅关闭 | NestJS `app.enableShutdownHooks()` + `OnModuleDestroy` | `process.on('SIGTERM', ...)` |
| 请求 ID | `nestjs-pino` 内置 `genReqId`,或自写中间件用 `cuid()` | `uuid` / 自增计数器 / `Math.random` |
| CI | GitHub Actions(`.github/workflows/ci.yml`) | 其它 CI 系统 |
| 容器化 | Dockerfile 多阶段(deps → builder → runner) | 单阶段 Dockerfile / Buildpacks |

选型一旦在 `<v1.1 任务清单>` 中确认,**Claude Code 不得擅自改换**。

### 17.3 V1.1 仍然不做(沿用 §1 + 追加)

- 不引入 Redis(限流也用内存 storage)
- 不引入 BullMQ / 队列 / 定时任务
- 不做操作日志 / 审计日志的**数据库持久化**
- 不接入 OpenTelemetry / Sentry / Datadog / APM
- 不暴露 `/metrics` 端点
- 不做 refresh token / 本人改密码 / 微信登录 / RBAC / 多租户 / 文件上传 Provider / pgvector / LLM
- 不修改 `prisma/schema.prisma`
- 不修改 `src/modules/auth/` 与 `src/modules/users/` 的业务路由 / 入参 / 出参 / HTTP 方法 / 权限标注
- 不修改 §6 接口清单已有任何接口
- 不为日志 / 限流 / helmet 单建 `*.config.ts`,统一归 `src/config/app.config.ts`

发现需求超出 V1.1 范围 → **必须暂停说明**,不得"先实现再回滚"。

### 17.4 与 v1 铁律的衔接(必须复用,禁止另起炉灶)

- **错误处理**:限流命中、健康检查 ready 失败等异常**必须**走 `BizException` + `AllExceptionsFilter`;**禁止** `throw new HttpException(...)` 绕过统一错误码
- **响应格式**:三个健康检查端点继续走 `ResponseInterceptor` 包装;Swagger 装饰器使用 `@ApiWrappedOkResponse(...)` 而非裸 `@ApiOkResponse`
- **错误码段位**:`TOO_MANY_REQUESTS = 42900`(`4xxxx` 段),`message: 请求过于频繁，请稍后再试`,`httpStatus: 429`;**不暴露阈值数字、剩余配额、重置时间**
- **配置归属**:`LOG_LEVEL` / `LOGIN_THROTTLE_LIMIT` / `LOGIN_THROTTLE_TTL_SECONDS` 全部归 `src/config/app.config.ts`
- **业务代码不直读 `process.env`**:V1.1 新增环境变量同样遵守此规则
- **日志屏蔽清单**:`password` / `newPassword` / `passwordHash` / `authorization` / `cookie` / `token` / `accessToken` / `refreshToken` / `secret` 命中字段日志中**必须显示为 `[REDACTED]`**,不能仅做长度截断

### 17.5 健康检查三端点契约

| 端点 | 检查内容 | 响应 |
|---|---|---|
| `GET /api/health` | 进程存活(向后兼容) | `{ code: 0, message: 'ok', data: { status: 'ok' } }` |
| `GET /api/health/live` | 进程存活(K8s liveness) | `{ code: 0, message: 'ok', data: { status: 'ok' } }` |
| `GET /api/health/ready` | DB 连通(K8s readiness) | 成功 200 + `{ status: 'ok', db: 'up' }`;失败 **HTTP 500** + `{ code: 50000, message: '服务器内部错误', data: null }` |

铁律:

- 三端点都必须 `@Public()`,都走统一响应包装
- 三端点都必须有 `@ApiOperation` + `@ApiWrappedOkResponse(...)`
- `/api/health/ready` DB 失败时抛 `BizException(BizCode.INTERNAL_ERROR)`,由 `AllExceptionsFilter` 按 `BizCode.INTERNAL_ERROR.httpStatus` 输出 **HTTP 500**;**禁止**直接 `throw new ServiceUnavailableException()`
- v1 已有的 `/api/health` E2E 必须继续通过,**不破坏**向后兼容

**关于 ready 失败 HTTP status 的最终决策(方案 A,以 `ARCHITECTURE.md` §11.4 为最高优先级)**:

- `ARCHITECTURE.md` §11.4 规定"HTTP status 由 `BizCode` 的 `httpStatus` 决定";`BizCode.INTERNAL_ERROR.httpStatus = 500`,因此 ready 失败实际响应是 HTTP 500 + `code: 50000`,而不是 K8s 标准 readiness 的 503
- 本期(15.5)**不**新增 `BizCode.SERVICE_UNAVAILABLE`、**不**修改 `AllExceptionsFilter`、**不**对 ready 路径做特判
- Claude Code **不得**在 15.5 范围内自行新增 `BizCode.SERVICE_UNAVAILABLE`、修改 `AllExceptionsFilter` 或对 ready 路径做特殊映射;若未来确需标准 HTTP 503,作为独立任务在 V1.2+ 立项,届时一并修订本节、`AGENTS.md` §17.5、`<v1.1 任务清单>` §15.5 三处描述
- K8s readiness 对任意 5xx 一律视作 unready,500 与 503 在容器编排层面行为一致,生产可用性不受影响

### 17.6 优雅关闭契约

```typescript
// PrismaService
async onModuleDestroy() {
  await this.$disconnect();
}
```

```typescript
// main.ts
app.enableShutdownHooks();
```

铁律:

- 不在 `main.ts` 自写 `process.on('SIGTERM', ...)`,NestJS 已经处理
- 不 `process.exit(0)` 强制退出
- 关闭顺序由 NestJS lifecycle hook 控制

### 17.7 限流契约

- 仅 `POST /api/auth/login` 走限流(基于路径或 controller 方法装饰器)
- 限流 storage 固定为 `@nestjs/throttler` 内存 storage,**禁止** Redis storage
- 限流参数从 `app.config.ts` 注入,**不**硬编码在装饰器里
- 超限抛 `BizException(BizCode.TOO_MANY_REQUESTS)`,HTTP 429 + 统一响应体
- 限流命中**不返回** `Retry-After` 头泄露阈值

### 17.8 Claude Code 工具使用约束

V1.1 阶段对 Claude Code 自身工具链的额外约束:

- **TodoWrite**:V1.1 工程加固任何任务开始前,先用 TodoWrite 拆出当前任务的子步骤;每完成一步立即标记 completed,**禁止**批量标记
- **Plan(ExitPlanMode)**:Dockerfile / CI 流水线 / 健康检查升级这类影响"启动方式"或"部署方式"的任务,**必须**先出 Plan 经用户确认,再动代码
- **Skill**:不要因为接入了 pino 就主动调用 `/loop` / `/schedule` 等周期性任务;V1.1 不引入定时任务
- **Agent(subagent)**:大段调研类任务(选 helmet 还是其他、CI matrix 设计)可走 Explore / general-purpose subagent,但**最终选型必须落到 `<v1.1 任务清单>`**,不能口头敲定后直接实现
- **Commit**:V1.1 任务按 `<v1.1 任务清单>` 编号一次一 commit,commit message 前缀建议 `v1.1: <任务编号> <简述>`(参考仓库已有的 `test: 14.x` 风格);**不得**把多个任务揉进同一 commit
- **不修改 `ARCHITECTURE.md` §1-§10、§9 升级路径表、§6 接口清单**:V1.1 是 §11 增量,这些已锁定的章节非用户明确要求不动
- **不修改 `prisma/schema.prisma`**:V1.1 不需要数据模型变更
- **不修改 `package.json`** 中已有依赖版本(仅在对应任务中按 `<v1.1 任务清单>` 声明的依赖添加新条目);若添加新依赖,先在 `<v1.1 任务清单>` 任务卡里登记
- **不修改 `docker-compose.yml`**:V1.1 容器化只交付独立的 `Dockerfile`;`docker-compose.prod.yml` 不在 V1.1 范围

### 17.9 V1.1 禁止"顺手做"清单

| 反模式 | 为什么禁止 |
|---|---|
| 接了 pino → 顺手把 request body 全打日志 | 日志膨胀 + 敏感数据泄漏;只打必要字段(method、url、status、duration、requestId、userId) |
| 接了 throttler → 顺手对所有接口加限流 | 限流参数未经业务评估,易挡正常用户 |
| 接了 terminus → 顺手加 Redis / 外部 API 健康检查 | V1.1 不引入 Redis,也不依赖外部 API |
| 有 Dockerfile → 顺手写 `docker-compose.prod.yml` | 用户明确要求 V1.1 不动 `docker-compose.yml`,且生产 compose 需按真实环境定制 |
| 有 CI → 顺手加发布到 npm / Docker Hub 的 job | 发布流程超出 V1.1,凭据管理与版本号策略需单独评估 |
| 有日志 → 顺手把 BizException 都写 ERROR 级日志 | BizException 是预期业务错误,应是 INFO 或 WARN;ERROR 留给未捕获异常和 5xx |
| 有限流 → 顺手在 service 里加二次防护 | 防护重复,且 service 层难以正确实现 IP 维度限流 |
| 有 requestId → 顺手塞进 JWT payload | JWT 签发时确定,requestId 每请求生成,语义不匹配 |

### 17.10 V1.1 阶段验收门槛

每个 V1.1 任务完成后,Claude Code **必须**按以下两档逐项验证再报告完成:

#### A 档 — 基础验收(每个任务都必须跑)

1. `pnpm lint` 通过
2. `pnpm typecheck` 通过
3. `pnpm test:e2e` 全部通过(测试套件全绿,具体用例数以 Jest 输出为准,不在本文档硬编码)
4. 该任务自身在 `<v1.1 任务清单>` 列出的验收标准全部满足
5. 没有引入未在 `<v1.1 任务清单>` 任务卡声明的新依赖

#### B 档 — 手工验证(仅当任务涉及 HTTP 行为、全局中间件、拦截器、Guard、Controller、Swagger 时,在 A 档基础上追加)

启动服务,逐项确认:

- `/api/docs` 能正常打开,Swagger UI 完整可用
- `GET /api/health` 仍按 v1 契约返回(向后兼容,响应体为 `{ code: 0, message: 'ok', data: { status: 'ok' } }`)
- 本任务**新增或影响的接口**能按预期返回,覆盖典型成功路径与典型错误路径

#### 档位归属说明

- **必须跑 B 档**的任务示例:接入 `nestjs-pino`(影响全局日志中间件)、请求 ID 中间件、健康检查升级(新增 controller / 改 Swagger)、helmet(全局响应头)、登录限流(影响 Guard / Controller / Swagger 错误响应)
- **只跑 A 档即可**的任务示例:GitHub Actions CI 流水线(不动运行时)、Dockerfile 镜像构建(交付物层面变更,运行时行为不变)、优雅关闭(改 lifecycle 但 HTTP 契约不变;若改动确实可能影响请求收尾,可补 B 档观察一次)

任一未通过 → **不算完成,不能 commit,不能向用户报告"任务完成"**。

### 17.11 边界声明

V1.1 完成后,**不自动触发** §9 升级路径。任何"日志接进来了顺手接 APM""限流接进来了顺手上 Redis""健康检查接进来了顺手暴露 metrics"的延伸,都必须重新评估业务诉求并经用户明确确认,Claude Code **不自行判定**。

---

## 18. Claude Code v2.0 baseline 执行约束(RBAC + Auth)

> 本节是 Claude Code 在 v2.0 baseline 阶段的特定执行约束,**优先级高于 §17**(§17 是 V1.1 历史阶段约束,已收尾)。
> Claude Code 修改 v2.0 相关代码前,**必须**:
> 1. 读完 [`docs/adr/ADR-001-v2-rbac-auth-baseline.md`](./docs/adr/ADR-001-v2-rbac-auth-baseline.md) 全文
> 2. 读完 `ARCHITECTURE.md` §12(v2.0 baseline 升级章节)
> 3. 确认当前任务所处 Phase(0 / 1 / 2.x / 3.x / 4),且前置 Phase 已完成
>
> v2.0 与 v1 铁律冲突时,**以 ADR-001 + 本节为准**(v1 §1-§16 中标注"v2.0 已升级"的条目按 v2.0 执行;其余 v1 铁律保留生效)。

### 18.1 v2.0 阶段范围(当前 Phase 0)

**Phase 0 当前 PR 范围(本次)**:

- ✅ 只允许修改文档:`ARCHITECTURE.md` / `CLAUDE.md` / `AGENTS.md` / `docs/capability-unlock-matrix.md` / `CHANGELOG.md` + 新建 `docs/adr/ADR-001-v2-rbac-auth-baseline.md`
- ❌ 不允许修改 `src/**`
- ❌ 不允许修改 `prisma/schema.prisma`
- ❌ 不允许创建 migration(`prisma/migrations/`)
- ❌ 不允许修改 `package.json` / `pnpm-lock.yaml`
- ❌ 不允许运行 `prisma migrate dev` / `prisma migrate deploy`
- ❌ 不允许任何代码实现(包括装饰器 / Guard / service / DTO / controller / 测试)

**Phase 1 起才允许动 schema / migration / seed**;**Phase 2.x 起才允许动 src 代码**;**Phase 3.x 起才允许动测试**。

> **Phase 1+2+3 合并实施策略(基于 Phase 0 后的可行性核查修订)**:
> - Phase 1 **不能单独 PR 合并 `main`**(删 `User.role` + 删 `Role` enum 会让 18 个文件 + 100+ 引用点同步 typecheck 红;详见 ADR-001 §7.1A)
> - **Phase 1+2+3 合并到同一实现 PR**,分 **7 个逻辑 commit**;**Phase 4 仍单独 PR**
> - Phase 0(本 PR)合并 `main` 后,**立即**打 `v1.x-maintenance` 分支,再从 `main` 开 `v2/rbac-auth-baseline` 实现分支
> - **不调整 GitHub branch protection / required checks**;中间 commit(1-6)CI 红是合规预期,**只在 PR 最终 HEAD(commit 7)CI 全绿后合并**
> - 中间 commit 仅作为 review 边界,**不允许单独合并 / cherry-pick / revert 到 `main`**
> - 合并方式**优先 `merge commit`**(保 7 个 commit 边界);若 PR 期间产生大量 `fixup!` / `wip:` commit,合并前必须 `git rebase -i` 整理为 7 个逻辑 commit,再 force-push 触发最终 CI

### 18.2 v2.0 baseline 必备能力清单(Phase 1-3 实施时遵守)

详见 ADR-001 §4。摘要:

- **RBAC 四表**:`Role` / `Permission` / `UserRole` / `RolePermission`(Phase 1)
- **三个种子角色**:`super_admin`(`*`)/ `admin`(`user:read` + `user:write` + `role:read` + `permission:read`)/ `user`(空)— 全部 `isSystem=true`
- **七条种子权限**:`*` / `user:read` / `user:write` / `user_role:assign` / `role:read` / `role:write` / `permission:read`
- **权限码命名严格** `<resource>:<action>` 两段式,**不允许唯一例外**(永久红线第 27 条)
- **`@Permissions(...)` 装饰器**(AND 语义)+ **`PermissionsGuard`** 全局注册,顺序 `JwtAuthGuard → PermissionsGuard`
- **`@AnyPermission(...)` OR 语义** baseline 不做,**不是永久禁止**,走 ADR B-13 解锁
- **JwtPayload 字段** `{ sub, username, typ: 'access' | 'refresh', jti }`(Phase 2.1 实现)
- **Refresh token 表 `RefreshToken`**,`tokenHash` sha256 存储(永久红线第 11 条)
- **Refresh rotation 强制**:每次 refresh 旧 token 立即 `revokedAt`
- **Logout 语义固定**(ADR-001 §9.3):
  - 要求 access token 登录(走 `JwtAuthGuard`)
  - 必须 body 提交 `{ refreshToken }`
  - 只吊销当前 `currentUser.id` 对应的、`tokenHash` 匹配的那条
  - `userId !== currentUser.id` 一律拒绝(防恶意吊销)
  - 找不到匹配统一返回 `{ status: 'ok' }`(防账号枚举)
- **五条 super_admin 铁律**(ADR-001 §4.5):
  1. 只有已有 super_admin 可以分配 super_admin
  2. 非 super_admin 不得授予 super_admin
  3. 禁止移除最后一个 active super_admin 身份
  4. 禁止禁用 / 软删最后一个 active super_admin
  5. 禁止用户移除自己的 super_admin 身份
- **创建用户防权限提升**(ADR-001 §9.4):
  - `POST /api/users` 缺省 `roleCodes: ['user']`
  - 显式非缺省值需调用者拥有 `user_role:assign`(否则抛 `FORBIDDEN_ROLE_OPERATION`)
  - **不要**用 controller 层 `@Permissions('user:write', 'user_role:assign')` 简化(违背最小权限)
- **`@Public()` 与 `@Permissions(...)` 互斥**(ADR-001 §9.5):
  - 启动期校验扫描全部路由,发现同时标两个装饰器即抛错退出(实现细节由 Phase 2.1 评估)
  - Phase 3 必须有 E2E 用例守护此不变式
- **Logout 与 refresh 接口 BizCode**:统一走 `UNAUTHORIZED=40100`,baseline **不**新增 `REFRESH_TOKEN_EXPIRED` 等细分码

### 18.3 v2.0 baseline 不做的事(派生项目走 ADR 解锁,不是永久禁止)

- 部分通配权限(`user:*` / `*:read`)→ B-12
- `@AnyPermission(...)` OR 语义 → B-13
- 数据级 / 行级权限 → B-14
- 角色继承 / 部门范围权限(`parentRoleId`)→ B-15
- Access token 主动吊销(blacklist)→ B-7 残余(联动 B-10 Redis)
- Refresh token family / reuse detection 全链路吊销 → B-7 残余
- 重置密码同步吊销该用户全部 refresh token → B-7 残余
- 本人改密码 `PUT /api/users/me/password` → B-8(保留)
- CASL / ability 表达式引擎 → B-1(原 RBAC ADR 改造为 CASL 解锁条目)
- 多租户 / 组织树 → B-2(不变)

### 18.4 v2.0 禁止"顺手做"清单

| 反模式 | 为什么禁止 |
|---|---|
| 接了 RBAC → 顺手加 CASL | baseline `Set.has() + *` 已足够;CASL 走 ADR B-1 |
| 接了 RBAC → 顺手加 `@AnyPermission` | 走 ADR B-13;OR 语义只在确实需要时引入 |
| 接了 refresh → 顺手加 access token blacklist | 需要 Redis(B-10);走 ADR B-7 残余 |
| 接了 refresh → 顺手加 token family 异常重放检测 | 走 ADR B-7 残余;baseline 仅检测单 token 重放 |
| 接了 logout → 顺手吊销该用户全部 refresh | 违反 "logout 只吊销当前 session" 语义 |
| 接了 RBAC → 顺手把 permission code 做成字典表 | 永久红线第 26 条,代码契约不进字典 |
| 接了 RBAC → 顺手用三段式权限码(`user:role:assign`)| 永久红线第 27 条;统一两段式,`user_role:assign` |
| 创建用户 → 顺手用 `@Permissions('user:write', 'user_role:assign')` 双护栏 | 违背最小权限;只有显式非默认 `roleCodes` 才需 `user_role:assign`(service 层判断) |
| 重置密码 → 顺手吊销所有 refresh token | baseline 不做(传承 v1 §7.7);需立即阻断改 `status=DISABLED` |
| JwtPayload → 顺手塞 `roles` / `permissions` | 永久红线第 3 条(v2.0 升级);权限即时生效靠每请求查库 |

### 18.5 v2.0 阶段验收门槛

每个 v2.0 任务完成后,Claude Code **必须**逐项验证再报告完成:

**Phase 0(当前)**:
- `git diff --name-only` 中**无** `src/**` / `prisma/**` / `package.json` / `pnpm-lock.yaml` / `.github/**` 路径
- 工作目录 `prisma/migrations/` 无新增
- 全仓库 grep 不到 "v2.0 不做 RBAC" / "v2.0 禁止 refresh" / "v2.0 禁止 logout" 之类残留表述(本 ADR / CHANGELOG 内"v1 历史限制"类引用不计)
- ADR-001 状态在 PR 提交期间为 `Proposed`,Phase 0 PR 最终收尾时切换为 `Accepted` 并回填 Accepted 日期(本 PR 已于 2026-05-18 完成切换)

**Phase 1-3**:沿用 v1 验收门槛(`pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm test:contract` / `pnpm test:e2e` 全绿),外加 ADR-001 §10 的本 Phase 验收清单。

### 18.6 边界声明

v2.0 baseline 完成后,**不自动触发** §18.3 中的任何 B 类解锁。任何"RBAC 接进来了顺手加 CASL""refresh 接进来了顺手加 access 黑名单"的延伸,都必须重新评估业务诉求并经用户明确确认,Claude Code **不自行判定**。
