# 能力解锁矩阵

> 把模板里的「v1 不做 / 派生项目可能要做」清单转译为可操作的解锁矩阵。
>
> **使用方法**:派生项目立项时通读一次,把已确定要做的能力标 `🟡 计划中`,实施完成后标 `✅ 已解锁 (ADR-NNN)`。
>
> **配套文档**:[`derived-project-governance.md`](./derived-project-governance.md)(治理总则)、`docs/adr/`(每个 B 类解锁对应一篇 ADR)。

---

## 1. 速读

- **A 类 — 永久铁律**:派生项目也必须保留,见文末 §A
- **B 类 — 默认禁止,可通过 ADR 解锁**:见 §B(11 个条目,占本文主体)
- **C 类 — 派生项目正常业务能力**:见 §C(无需 ADR,守住 A 类铁律即可)
- **D 类 — 表述过死**:见 §D(给 AI 的"原文如何在派生项目里读"对照表)

---

## 2. 状态标记约定

| 标记 | 含义 |
|---|---|
| 🔒 未解锁(默认) | 当前派生项目未启用该能力 |
| 🟡 计划中 | 已立项写 ADR,但代码未完成 |
| ✅ 已解锁 (ADR-NNN) | ADR Accepted + 代码 + 测试 + 契约全部就绪 |
| ⛔ 永不解锁 | 派生项目明确决定永不做,记入 ADR `Rejected` |

派生项目立项后,**逐行**更新本文 §3 派生项目状态全表。

---

## §B 可解锁能力(11 个条目)

### B-1 — RBAC / permission 表 / 按钮级权限

| 字段 | 内容 |
|---|---|
| 类别 | B(默认禁止,ADR 解锁) |
| 模板原文位置 | `CLAUDE.md` §1, `AGENTS.md` §1, `ARCHITECTURE.md` §1 / §4 / §7.11, §9 升级路径行"真要做权限点到按钮级" |
| 模板为什么不做 | 三层 `Role` 够用 99% 的内部管理系统;permission 表 + casl 是**权限模型升级**,不是渐进改造,会牵动每个 `assertCanManageUser` |
| 派生项目什么时候可以做 | ① 真出现"按钮级 / 字段级 / 资源级"权限需求;② 出现"用户多角色"诉求;③ 客户提出"权限点要后台可配" |
| 解锁前必须确认 | 是不是真按钮级,还是"再加一两个角色就够"(后者只需扩 `enum Role`,不是 RBAC);权限点写代码还是写 DB;是否需要 `user_roles` 多对多 |
| 是否需要 migration | ✅ 新增 `permissions` / `role_permissions` / `user_roles` 表 |
| 是否需要测试 | ✅ E2E 覆盖每条权限点 + 单测覆盖 `casl` Ability 表达式 |
| 是否需要更新 OpenAPI contract | ⚠️ 若新增权限管理接口需要;响应格式不变 |
| 解锁后需更新的文档 | 派生项目的 `CLAUDE.md` 底部追加权限规则段(或 ADR 引用);`docs/permission-model.md` 新增;本矩阵对应行状态;`docs/development.md` 路由总览 |
| 不变式声明(实施后仍保留) | 全局 `APP_GUARD` 注册顺序、`@Public()` / `@Roles(...)` 互斥、`JwtPayload` 最小化、最后一个活跃 SUPER_ADMIN 保护 |
| 当前派生项目状态 | 🔒 未解锁 |

### B-2 — 组织树 / 多租户

| 字段 | 内容 |
|---|---|
| 类别 | B |
| 模板原文位置 | `CLAUDE.md` §1, `ARCHITECTURE.md` §4, §9 升级路径行"救援队系统启动 / 出现 A 队不能看 B 队" |
| 模板为什么不做 | 通用模型很难一刀切,不同业务的组织树深度、跨树访问规则差异大 |
| 派生项目什么时候可以做 | ① 救援队系统启动(必有中队/分队/小组);② 多客户项目(必有租户隔离);③ 内管系统出现"按部门看数据"诉求 |
| 解锁前必须确认 | 是"组织树"(单租户内部树状)还是"多租户隔离"(`tenantId` 顶层字段);删除组织时人员归属;跨组织查看的权限规则;是否需要"代理某个组织"功能 |
| 是否需要 migration | ✅ `Organization` 表(自引用 `parentId`)+ `User.orgId` / `User.tenantId` 外键 |
| 是否需要测试 | ✅ 跨租户访问拒绝、组织树 CRUD、循环引用防护、删除组织时人员归属 |
| 是否需要更新 OpenAPI contract | ✅ 新增 `orgs/` 接口 |
| 解锁后需更新的文档 | `docs/multi-tenant.md` 或 `docs/organization.md` 新增;本矩阵;`docs/development.md` 路由总览 |
| 不变式声明(实施后仍保留) | 软删除策略(`notDeletedWhere`)、`userSafeSelect`、统一响应格式 |
| 当前派生项目状态 | 🔒 未解锁 |

### B-3 — 文件上传 Provider(本地 / OSS / R2 / COS / 七牛)

| 字段 | 内容 |
|---|---|
| 类别 | B |
| 模板原文位置 | `CLAUDE.md` §1, `ARCHITECTURE.md` §4, §9 升级路径行"第一个产品要传文件";`common/storage/` 已留 interface |
| 模板为什么不做 | Provider 选型与业务强耦合,选型差异大;签名 URL / 分片 / 直传策略需要按 Provider 实现细节定制 |
| 派生项目什么时候可以做 | 接到具体上传需求时(救援队现场照片、管理后台导出附件、用户头像) |
| 解锁前必须确认 | 选哪个 Provider(腾讯云 COS / 阿里 OSS / R2 / 本地);是否需要签名 URL / 分片上传 / 直传策略;签名 URL TTL;附件元信息是否进 DB(见 B-4 附件元数据) |
| 是否需要 migration | ⚠️ 若需要 `Attachment` 元数据表则要(见 B-4) |
| 是否需要测试 | ✅ 上传 / 下载 / 签名 URL 生成 / 权限边界(私有附件不能被未授权用户访问) |
| 是否需要更新 OpenAPI contract | ✅ 新增上传 / 下载接口 |
| 解锁后需更新的文档 | `docs/storage.md` 写清选型与签名 URL 策略;`src/common/storage/storage.module.ts` 注册;本矩阵 |
| 不变式声明(实施后仍保留) | 文件标识统一叫 `key`(不叫 `path` / `filename` / `url`);响应拦截器跳过文件下载流;Swagger 100% 覆盖 |
| 当前派生项目状态 | 🔒 未解锁 |

### B-4 — 附件元数据表

| 字段 | 内容 |
|---|---|
| 类别 | B |
| 模板原文位置 | `ARCHITECTURE.md` §3 "future modules/files/";与 B-3 通常成对解锁 |
| 模板为什么不做 | 附件元信息的结构与业务强耦合(任务附件 vs 用户头像 vs 装备照片差异很大) |
| 派生项目什么时候可以做 | 通常与 B-3 同步解锁:文件上传后需要查询、列表、删除 |
| 解锁前必须确认 | 元数据表是否中心化(`Attachment` 一表)还是按业务分散(`MissionAttachment` / `UserAvatar`);软删除策略与 storage 物理文件保留期 |
| 是否需要 migration | ✅ `Attachment` 表(`id`, `key`, `mimeType`, `size`, `uploaderId`, `bizType`, `bizId`, `createdAt`, `deletedAt`) |
| 是否需要测试 | ✅ 元数据 CRUD + 与 storage 联调 + 软删除 |
| 是否需要更新 OpenAPI contract | ✅ |
| 解锁后需更新的文档 | `docs/storage.md`;`docs/attachment.md`(若中心化)或各业务模块文档;本矩阵 |
| 不变式声明(实施后仍保留) | 软删除 `deletedAt: null` 过滤、唯一性预检查、`cuid()` 主键 |
| 当前派生项目状态 | 🔒 未解锁 |

### B-5 — 字典管理(后台可配枚举)

| 字段 | 内容 |
|---|---|
| 类别 | B |
| 模板原文位置 | `CLAUDE.md` §1, `ARCHITECTURE.md` §4 |
| 模板为什么不做 | 很多枚举其实硬编码就够,可配字典是"省事陷阱"——一旦上线运维要长期维护 |
| 派生项目什么时候可以做 | ① 出现"前端枚举要后台可配"明确诉求;② 业务侧需要不发版就改类型(如装备分类、任务状态) |
| 解锁前必须确认 | 哪些枚举真要可配(硬编码 enum 不够吗);是否需要多语言;是否需要"字典分组" |
| 是否需要 migration | ✅ `Dict` + `DictItem` 两表 |
| 是否需要测试 | ✅ CRUD + 字典缓存(若有) |
| 是否需要更新 OpenAPI contract | ✅ |
| 解锁后需更新的文档 | `docs/dict.md`;本矩阵 |
| 不变式声明(实施后仍保留) | DTO 字段白名单、Swagger 100% 覆盖 |
| 当前派生项目状态 | 🔒 未解锁 |

### B-6 — 审计日志 / 操作日志(数据库持久化)

| 字段 | 内容 |
|---|---|
| 类别 | B |
| 模板原文位置 | `CLAUDE.md` §1, `CLAUDE.md` §17.3 "不做操作日志 / 审计日志的数据库持久化", `ARCHITECTURE.md` §4 / §9 升级路径 |
| 模板为什么不做 | 持久化对接复杂,业务诉求未明前不堆字段;V1.1 已通过结构化日志(stdout)覆盖排错诉求 |
| 派生项目什么时候可以做 | ① 救援队涉及人员调度,合规要求保留操作历史;② 客户提出"想看谁动了某条数据";③ 监管要求 |
| 解锁前必须确认 | 写哪个表(独立 `AuditLog` vs 各业务表加 `*_history`);触发位置(全局拦截器 / 事件 / service 显式调用);保留期与归档策略 |
| 是否需要 migration | ✅ `AuditLog` 表(`id`, `actorId`, `action`, `entity`, `entityId`, `before` JSON, `after` JSON, `createdAt`)+ 索引 |
| 是否需要测试 | ✅ 关键操作(创建用户 / 改角色 / 删除)落日志 + 查询接口权限边界 |
| 是否需要更新 OpenAPI contract | ✅ 若提供查询接口 |
| 解锁后需更新的文档 | `docs/audit.md`;本矩阵 |
| 不变式声明(实施后仍保留) | 日志 redact 清单(`password` / `token` / `passwordHash` 等敏感字段在 audit JSON 中同样需要 redact)、统一响应格式 |
| 当前派生项目状态 | 🔒 未解锁 |

### B-7 — refresh token / token 主动吊销

| 字段 | 内容 |
|---|---|
| 类别 | B |
| 模板原文位置 | `CLAUDE.md` §1, `ARCHITECTURE.md` §6 / §9, [`docs/security.md`](./security.md) "Token 吊销升级路径"(已给出 5 步 schema 演进方案) |
| 模板为什么不做 | JWT + `status=DISABLED` 已覆盖封禁主路径;refresh token 增加状态管理复杂度 |
| 派生项目什么时候可以做 | ① 小程序 7 天 token 太短,需要无感续期;② 管理员重置密码后旧 token 必须立即失效;③ PC 端"踢人下线" |
| 解锁前必须确认 | 走 `docs/security.md` 已给出的 `tokenVersion` 方案,还是 refresh token + Redis blacklist;refresh token TTL 与 access token TTL 的差距;轮转(rotation)策略 |
| 是否需要 migration | ✅ `User.tokenVersion` 字段(回填 0)或 `RefreshToken` 表 |
| 是否需要测试 | ✅ 重置密码后旧 access token 立即失效;refresh 接口轮转;并发刷新场景 |
| 是否需要更新 OpenAPI contract | ✅ 若新增 `POST /api/auth/refresh` |
| 解锁后需更新的文档 | `docs/security.md` "Token 吊销升级路径"状态从"未实现"改为"已实现 (ADR-NNN)";`CLAUDE.md` §1 / `AGENTS.md` §1 对应行加 ADR 引用 |
| 不变式声明(实施后仍保留) | `JwtPayload` 最小化(可加 `tv`,但不塞 role);两阶段错误码区分(`LOGIN_FAILED` vs `UNAUTHORIZED`);防账号枚举四场景 |
| 当前派生项目状态 | 🔒 未解锁 |

### B-8 — 本人改密码接口(`PUT /api/users/me/password`)

| 字段 | 内容 |
|---|---|
| 类别 | B |
| 模板原文位置 | `CLAUDE.md` §1, `ARCHITECTURE.md` §6 段"v1 故意不提供" |
| 模板为什么不做 | 配套决策多:`oldPassword` 校验、防爆破、是否吊销其他设备 token;内管系统由管理员重置即可 |
| 派生项目什么时候可以做 | ① 普通用户能登录的产品(前台 C 端、小程序绑定账号);② 客户明确要求"自助修改密码" |
| 解锁前必须确认 | 是否要求 `oldPassword`(强烈建议是);是否需要防爆破(走 throttler);改完是否吊销其他设备 token(联动 B-7) |
| 是否需要 migration | 通常无 |
| 是否需要测试 | ✅ 旧密码错 → 401;新密码不符合复杂度 → 422;改完后旧 token 是否仍可用(取决于决策) |
| 是否需要更新 OpenAPI contract | ✅ 新增接口 |
| 解锁后需更新的文档 | `docs/development.md` 路由总览;`CLAUDE.md` / `AGENTS.md` §1 加 ADR 引用 |
| 不变式声明(实施后仍保留) | 密码 DTO 校验(8 位 + 数字 + 字母);`bcrypt.hash()` 落库前必走;`passwordHash` 永不出响应 |
| 当前派生项目状态 | 🔒 未解锁 |

### B-9 — 微信 / 小程序 / 第三方登录

| 字段 | 内容 |
|---|---|
| 类别 | B |
| 模板原文位置 | `CLAUDE.md` §1, `ARCHITECTURE.md` §9 升级路径行"第一个小程序产品要接" |
| 模板为什么不做 | 与具体小程序产品强绑;不同 OAuth 提供商策略差异大;账号合并 / 解绑等场景需要业务侧决策 |
| 派生项目什么时候可以做 | `u-mp-<biz>-api` 命名空间项目立项当天就要;或主项目接入第三方 OAuth(GitHub / Google / 微信扫码) |
| 解锁前必须确认 | 登录态如何关联到 `User`(直接给 `openid` 字段还是新增 `UserAuthBinding` 多对一表);是否需要"账号合并"(同一个人在不同 openid 下);是否支持解绑;是否需要新增 BizCode(如 `WECHAT_LOGIN_FAILED`) |
| 是否需要 migration | ✅ `User.openid` / `User.unionid` 字段,或 `UserAuthBinding` 表 |
| 是否需要测试 | ✅ wx.login 串接(可 mock)、绑定 / 解绑、首次登录建账号、重复登录复用账号 |
| 是否需要更新 OpenAPI contract | ✅ 新增接口 |
| 解锁后需更新的文档 | `docs/auth-strategies.md` 写清各登录策略与 User 模型映射;`src/modules/auth/strategies/<provider>.strategy.ts` 实现 |
| 不变式声明(实施后仍保留) | `JwtPayload` 最小化;两阶段错误码区分;每请求查库(不缓存)继续生效;最后一个活跃 SUPER_ADMIN 保护 |
| 当前派生项目状态 | 🔒 未解锁 |

### B-10 — Redis / 队列 / 定时任务

| 字段 | 内容 |
|---|---|
| 类别 | B |
| 模板原文位置 | `CLAUDE.md` §1, `ARCHITECTURE.md` §4 / §9 升级路径行"真有异步任务 / 限流"、"JWT 每请求查库成为瓶颈" |
| 模板为什么不做 | 运维复杂度上一个台阶,小规模无收益 |
| 派生项目什么时候可以做 | ① 真异步任务(推送、批量导入、报表生成);② 定时清理 / 报表;③ 多实例部署后限流要共享配额;④ JWT 校验热路径成为瓶颈 |
| 解锁前必须确认 | 是否真异步必要,还是同步够快;`BullMQ` vs `Bee-Queue` vs `agenda`;Redis 部署方式(自建 / 云服务);若引入 Redis 缓存用户状态,如何"被禁用户即时失效" |
| 是否需要 migration | 通常无(队列状态走 Redis,不进 PostgreSQL) |
| 是否需要测试 | ✅ 队列幂等、失败重试上限、任务超时 |
| 是否需要更新 OpenAPI contract | 通常无 HTTP 影响(除非新增队列管理接口) |
| 解锁后需更新的文档 | `docs/queue.md`;若引入 Redis 缓存用户状态,同步改 `CLAUDE.md` §8 "不主动加缓存"行(走 §7 修改继承段落流程) |
| 不变式声明(实施后仍保留) | 限流命中走 `BizException(BizCode.TOO_MANY_REQUESTS)`;响应格式不变;不绕过 `AllExceptionsFilter` |
| 当前派生项目状态 | 🔒 未解锁 |

### B-11 — LLM / 向量检索 / pgvector(填充 `modules/ai/`)

| 字段 | 内容 |
|---|---|
| 类别 | B |
| 模板原文位置 | `CLAUDE.md` §1, `ARCHITECTURE.md` §3 / §9;`modules/ai/` 当前只 README 占位 |
| 模板为什么不做 | 与具体 AI 产品强耦合;接口与提供商(OpenAI / Anthropic / Vercel AI SDK)选型差异大 |
| 派生项目什么时候可以做 | 第一个用到 LLM 或向量检索的产品启动时 |
| 解锁前必须确认 | LLM 提供商;是否需要 RAG(若是,确认 pgvector vs 独立向量库);prompt 模板的版本管理;是否需要流式响应(SSE / WebSocket) |
| 是否需要 migration | ⚠️ 若用 pgvector,启用扩展 + 新表;若纯外部调用,可能无 |
| 是否需要测试 | ✅ 外部调用 mock + 关键 prompt 输出格式 + 流式响应集成测试 |
| 是否需要更新 OpenAPI contract | ✅ 新增接口 |
| 解锁后需更新的文档 | `docs/ai-architecture.md`;`modules/ai/README.md` 从"占位"改为"实现说明"+ ADR 引用 |
| 不变式声明(实施后仍保留) | 流式响应若走 SSE,加入 `ResponseInterceptor` 跳过列表;敏感日志 redact 清单包含 prompt / completion;Swagger 100% 覆盖 |
| 当前派生项目状态 | 🔒 未解锁 |

---

## §C 派生项目正常业务能力(无需 ADR)

以下能力**不需要写 ADR**,守住 A 类铁律直接开发即可:

| 能力 | 标准做法 |
|---|---|
| 新增业务模块(`src/modules/orgs/`、`src/modules/missions/`、`src/modules/devices/`、`src/modules/files/` ...) | 平铺在 `src/modules/<name>/`,固定 4 文件结构(`*.module.ts` / `*.controller.ts` / `*.service.ts` / `*.dto.ts`)。**注意**:若新模块本身涉及组织树 / RBAC / 文件 Provider / 审计等 B 类能力,先走对应 B 类 ADR |
| 新增业务 Prisma model(对应 `prisma/schema.prisma` 增量) | 走 `prisma migrate dev` 增量演进,主键统一 `cuid()` 字符串,时间字段统一 `createdAt` / `updatedAt`,软删除统一 `deletedAt: DateTime?` |
| `User` 加普通业务字段(`phone` / `realName` / `birthday` / `orgId` 等) | 改 schema + migration;同步 `userSafeSelect` / `UserResponseDto`(必须同步,见 §A);入参 DTO 加白名单;唯一字段加对应 BizCode(如 `PHONE_ALREADY_EXISTS`) |
| 新增业务 DTO / Service / Controller | 固定结构;入参 DTO 必须 `class-validator` 装饰器;出参 DTO 显式列字段;Swagger 走 `@ApiWrapped*` 包装 |
| 新增业务 BizCode | 按段位 `110xx` / `120xx` 平铺,每模块前 100 个普通业务、后 100 个权限边界;三字段(`code` / `message` / `httpStatus`)必填 |
| 新增 E2E / contract / unit 测试 | E2E 放 `test/e2e/<feature>.e2e-spec.ts`;contract 走 `pnpm test:contract -u` 更新快照;unit 放对应模块的 `*.spec.ts` |
| 新增业务专属 docs(`docs/<biz>.md`、`docs/playbook-<biz>.md`) | 自由新增,**不删改**模板继承的 `docs/*.md`(`development.md` / `testing.md` / `deployment.md` / `security.md`) |

**C 类与 B 类的边界提醒**:

- `User` 加 `role` 之外的角色相关字段(如 `permissions` / `roleIds`) → **B-1 RBAC**,不是 C 类
- 新增业务模块**本身**是 C 类,但若该模块要做"组织树挂靠"→ 联动 **B-2 组织树**
- 新增文件相关业务模块 → 联动 **B-3 / B-4 文件上传 + 附件元数据**
- 给 `User` 加 `openid` → **B-9 微信登录**,不是 C 类(因为登录策略需要联动)
- 给 `User` 加 `tokenVersion` → **B-7 token 吊销**,不是 C 类

---

## §D 表述过死的对照表(给 AI 看)

派生项目里读到模板原文时,按以下对照表行动。**所有 D 类条目最终归属 B / C / 拒绝 三种行为之一**。

| 模板原文 | 派生项目如何读 |
|---|---|
| "AI 不得擅自补全 [B 类功能]" | "AI 在派生项目里看到 B 类需求时,**先查本矩阵和 `docs/adr/`**,无 ADR 先暂停引导写;不直接拒绝、不直接动代码" |
| "派生项目**绝不要碰** `src/modules/auth/**`" | "可扩展(B-9 新增登录策略 / B-7 加 tokenVersion 字段等场景),但必须保留:防账号枚举四场景一致 + Timing 防御 + `JwtPayload` 最小化 + 全局 `APP_GUARD` 注册" |
| "派生项目**绝不要碰** `src/modules/users/**`" | "可扩展(C 类加业务字段 / B-1 RBAC 升级 / B-8 本人改密码等场景),但必须保留:`userSafeSelect` 不漏 `passwordHash` + 软删除走 `notDeletedWhere()` + 自我保护 + 最后一个 SUPER_ADMIN 保护 + `assertCanManageUser` 双层校验" |
| "v1 不提供恢复接口" | "派生项目按 [`docs/security.md`](./security.md) §软删除策略 给出的接口契约实施 (`PATCH /api/users/:id/restore`,仅 SUPER_ADMIN,事务内查唯一性);属于 C 类(契约已定义) |
| "不主动加用户状态缓存优化" | "未触发 `ARCHITECTURE.md` §9 升级条件前不加;触发后按 §9 + 写 ADR(归属 B-10 Redis)" |
| "V1.1 不修改 prisma schema" | "**仅适用模板 V1.1 加固阶段**(已收尾,见 `TASKS.md`)。派生项目修改 schema 是正常工作流(C 类)" |
| "V1.1 不修改 auth / users 业务路由" | "**仅适用模板 V1.1 加固阶段**。派生项目可扩展,守 A 类铁律" |
| `CLAUDE.md` §17.11 / `AGENTS.md` §17.10 "V1.1 完成后不要自动触发 §9 升级路径" | "派生项目里 §9 升级是正常工作流,通过 ADR 流程触发,不需要等模板再升级一次" |
| "不引入 `LocalStrategy`" | "已有 `username + password` 路径**不必**为统一抽象引入 LocalStrategy;新增登录策略时按 B-9 走 ADR,放 `strategies/<provider>.strategy.ts`" |

---

## §A 永久铁律清单(派生项目也必须保留)

按"违反后果严重程度"由重到轻排列。**任何 ADR 都不能削弱本节任一条目**。

### 安全底线类(违反直接导致漏洞)

1. `passwordHash` 永不出响应(`userSafeSelect` 不能漏)
2. 密码落库前必须 `bcrypt.hash()`(salt rounds=10)
3. `JwtPayload` 不塞 `role` / 完整用户对象;角色判断走本次查库
4. 登录失败四场景统一响应(`LOGIN_FAILED` / HTTP 401)+ Timing 防御(`bcrypt.compare(dummyHash)`)
5. 生产环境拒绝默认 `JWT_SECRET` / `APP_CORS_ORIGIN=*` / `SUPER_ADMIN_*` 默认值
6. 业务代码不直读 `process.env`,统一走 `*.config.ts`
7. 全局 `APP_GUARD` 注册(`JwtAuthGuard` → `RolesGuard`),禁止 controller 上 `@UseGuards(...)`
8. `@Public()` 与 `@Roles(...)` 互斥
9. 最后一个活跃 SUPER_ADMIN 保护 + 自我保护(同事务内检查)
10. 日志 redact 清单(`password` / `newPassword` / `passwordHash` / `token` / `secret` 等)命中字段必须 `[REDACTED]`,不能只做长度截断

### 契约稳定类(违反破坏前端 / 监控)

11. 统一响应格式 `{ code, message, data }`
12. BizCode 三字段对象(`code` / `message` / `httpStatus`)+ `BizException` 类型签名锁死
13. BizCode 段位规划(`4xxxx`/`5xxxx` 通用 / `100xx`+`101xx` users / `110xx`+ 后续模块每段 200 个号段)
14. Swagger 100% 覆盖,使用 `@ApiWrapped*` 装饰器
15. 响应拦截器跳过路径(`/api/docs` / `/api/docs-json` / `/metrics` / 文件下载流)
16. OpenAPI 契约快照(`pnpm test:contract`)+ E2E 测试(`pnpm test:e2e`)作为 CI 合并门槛
17. 健康检查向后兼容:`/api/health` 必须仍按 v1 契约返回 `{ code: 0, message: 'ok', data: { status: 'ok' } }`

### 工程一致性类(违反让 AI 写错)

18. pnpm-only,禁止 npm / yarn / bun
19. 全局 `ValidationPipe`(`whitelist` + `forbidNonWhitelisted` + `transform`)
20. 入参 / 出参 DTO 分离,**禁止 `*.entity.ts`**
21. 入参 DTO 字段白名单(`UpdateMyProfileDto` / `UpdateUserDto` 不允许字段透传)
22. 唯一性预检查用 `findUnique`(包含软删),业务详情查询用 `findFirst + notDeletedWhere`
23. 软删除走 `update({ deletedAt, status: DISABLED })`,**禁止** `prisma.user.delete()`
24. 已应用的 migration 不可改写,只能新增 migration 增量演进
25. `prisma migrate dev` 必须先说明再执行;生产只跑 `migrate deploy`

### 文档协作类(违反让 AI 在派生项目里迷路)

26. 派生项目不删改 `ARCHITECTURE.md` / `CLAUDE.md` / `AGENTS.md` 继承段落,优先追加;确需修改时先 ADR(见 [`derived-project-governance.md`](./derived-project-governance.md) §7)
27. ADR 文件不删,即使状态是 Rejected(保留决策历史)

---

## 3. 派生项目状态全表

派生项目立项时填写下表(本表是模板基线,派生项目应在自己仓库的副本里维护):

| 能力 | 类别 | 当前状态 | ADR 编号 | 备注 |
|---|---|---|---|---|
| RBAC / permission | B-1 | 🔒 未解锁 | — | — |
| 组织树 / 多租户 | B-2 | 🔒 未解锁 | — | — |
| 文件上传 Provider | B-3 | 🔒 未解锁 | — | — |
| 附件元数据 | B-4 | 🔒 未解锁 | — | — |
| 字典管理 | B-5 | 🔒 未解锁 | — | — |
| 审计日志持久化 | B-6 | 🔒 未解锁 | — | — |
| refresh token / 吊销 | B-7 | 🔒 未解锁 | — | — |
| 本人改密码 | B-8 | 🔒 未解锁 | — | — |
| 微信 / 第三方登录 | B-9 | 🔒 未解锁 | — | — |
| Redis / 队列 / 定时 | B-10 | 🔒 未解锁 | — | — |
| LLM / 向量检索 | B-11 | 🔒 未解锁 | — | — |

---

> **维护提醒**:每次新增 ADR 时,更新本表对应行的状态与 ADR 编号;每解锁一项 B 类能力,同步更新各文档中对应的"未实现"段落(参见每条 B 类卡的"解锁后需更新的文档"行)。
