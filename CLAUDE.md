# CLAUDE.md — Claude Code 项目协作铁律

> 给 **Claude Code** 看的项目工作铁律,从 `ARCHITECTURE.md` §7 与附录抽取。
> 修改本仓库代码前必须读完:`ARCHITECTURE.md`(v1 蓝图)+ `CLAUDE.md` + `AGENTS.md`。
> 如本文与 `ARCHITECTURE.md` 表述冲突,**以 `ARCHITECTURE.md` 为准**。
> 除非用户明确要求,AI 不得修改 `ARCHITECTURE.md`;实现过程中发现文档与代码冲突时,必须先暂停并说明。

---

## 0. 修改代码前必读

- 必读三件套:`ARCHITECTURE.md` / `CLAUDE.md` / `AGENTS.md`
- 任何不在 v1 范围内的新增功能(见 §1),**必须先暂停并说明原因,不得擅自实现**
- 执行 `prisma migrate dev` 前必须先说明将生成 / 执行的迁移内容并等待确认;生产环境只允许 `prisma migrate deploy` 已审查 migration
- **pnpm-only**:依赖安装与脚本执行统一使用 `pnpm`,禁止 `npm` / `yarn` / `bun`,避免 lockfile 漂移
- `@nestjs/swagger` 必须按其 `peerDependencies` 选择与当前 NestJS 主版本兼容的版本,**禁止手动钉死主版本号**(如硬写 `^7.x`),否则会出现 peer 警告并隐藏 schema bug
- 每次只实现一个阶段,不跨阶段提前写;每个阶段完成后必须 lint / typecheck / test,或至少启动服务验证

---

## 1. v1 不做的事(刻意砍,需要时再加)

升级触发条件见 `ARCHITECTURE.md` §9。**以下功能 AI 不得擅自补全**:

- 不做 RBAC(permission 表 / 按钮级权限 / casl)——三层 `Role` 不算 RBAC
- 不做文件上传具体实现(本地 / OSS / R2)
- 不做 Redis / 队列 / 定时任务
- 不做注册接口、刷新 token、**本人改密码接口** `PUT /api/users/me/password`
- 不做微信小程序登录、多租户、组织树
- 不做 LLM / 向量检索——`modules/ai/` 只放 `README.md` 占位
- 不做操作日志 / 登录日志、字典管理
- 不引入 `LocalStrategy`——`username + password` 校验在 `auth.service.ts` 内手写
- 不创建 `*.entity.ts`——本项目不是 TypeORM 项目
- 不使用 Prisma 全局软删除中间件 / client extension
- 不主动加用户状态缓存"优化"
- 不预先做 storage Provider——`common/storage/` 只放 interface 与 types,**不需要 `.module.ts`**

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

### Guard 全局注册

`JwtAuthGuard` + `RolesGuard` 通过 `AppModule.providers` 中 `APP_GUARD` 全局注册,顺序固定 `JwtAuthGuard` → `RolesGuard`(先验登录,再验角色)。**禁止在 controller 上 `@UseGuards(...)`**。

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

层级固定:`SUPER_ADMIN > ADMIN > USER`。三层 Role **不是 RBAC**,不要扩展 permission 表 / `user_roles` 多对多 / `casl`。

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
