# 能力解锁矩阵(v1 + v2.0 baseline)

> 把模板里的「v1 不做 / 派生项目可能要做」清单转译为可操作的解锁矩阵。
>
> **使用方法**:派生项目立项时通读一次,把已确定要做的能力标 `🟡 计划中`,实施完成后标 `✅ 已解锁 (ADR-NNN)`。
>
> **配套文档**:[`derived-project-governance.md`](./derived-project-governance.md)(治理总则)、`docs/adr/`(每个 B 类解锁对应一篇 ADR)。

---

> **🚨 v2.0 baseline 升级公告**(2026-05-18 立项)
>
> v2.0 baseline 重置了红线分级,新增 `BL` 标签(baseline 已覆盖)与 B-12/13/14/15 四条解锁项;§A 永久红线从 27 条扩展至 29 条。
>
> - **B-1 RBAC**:旧"派生项目按 ADR 解锁"已退役,**v2.0 baseline 已覆盖**(状态改为 `🟢 baseline-covered`);B-1 改造为 "CASL / ability 表达式引擎" 解锁条目(默认仍不做)
> - **B-7 refresh token**:**主体 v2.0 baseline 已覆盖**(refresh + logout + rotation + 哈希存储);**残余**(access token 主动吊销 / Refresh token family / 异常重放全链路吊销 / 重置密码同步吊销该用户全部 refresh)仍走 ADR 解锁
> - **B-8 本人改密码**:**v2.0 baseline 仍不做**,保留派生项目 ADR 解锁
> - **新增 B-12 / B-13 / B-14 / B-15**:四条 v2.0 baseline 之外的细分权限能力,详见 §B
>
> 设计权威依据:[`adr/ADR-001-v2-rbac-auth-baseline.md`](./adr/ADR-001-v2-rbac-auth-baseline.md)。

---

## 1. 速读

- **A 类 — 永久铁律**:派生项目也必须保留,见文末 §A(v2.0 扩展至 29 条)
- **BL 类 — v2.0 baseline 已覆盖**:模板必备能力,派生项目自动继承;**不需要写 ADR**(参见 ADR-001)
- **B 类 — 默认禁止,可通过 ADR 解锁**:见 §B(v2.0 扩展为 13 条;原 B-1 / B-7 部分已迁入 BL 类)
- **C 类 — 派生项目正常业务能力**:见 §C(无需 ADR,守住 A 类铁律即可)
- **D 类 — 表述过死**:见 §D(给 AI 的"原文如何在派生项目里读"对照表)

---

## 2. 状态标记约定

| 标记 | 含义 |
|---|---|
| 🟢 baseline-covered | **v2.0 baseline 已覆盖**(自动启用,不需要 ADR;但派生项目可在 baseline 之上扩展) |
| 🔒 未解锁(默认) | 当前派生项目未启用该能力 |
| 🟡 计划中 | 已立项写 ADR,但代码未完成 |
| ✅ 已解锁 (ADR-NNN) | ADR Accepted + 代码 + 测试 + 契约全部就绪 |
| ⛔ 永不解锁 | 派生项目明确决定永不做,记入 ADR `Rejected` |

派生项目立项后,**逐行**更新本文 §3 派生项目状态全表。

---

## §B 可解锁能力(v2.0 后共 13 个条目;原 B-1 RBAC / B-7 refresh token 主体已迁入 BL 类)

### B-1 — CASL / ability 表达式引擎(原 RBAC 条目改造)

| 字段 | 内容 |
|---|---|
| 类别 | B(默认禁止,ADR 解锁) |
| 模板原文位置 | `CLAUDE.md` §1 / `AGENTS.md` §1 / `ARCHITECTURE.md` §7.11 / `docs/adr/ADR-001-v2-rbac-auth-baseline.md` §7.3 |
| v2.0 状态变更 | 🟢 **原"B-1 RBAC / permission 表 / 按钮级权限"已迁入 BL 类(v2.0 baseline 已覆盖,见 ADR-001 §4)**;本条改造为"CASL / ability 表达式引擎"独立解锁条目 |
| 模板为什么不做 | v2.0 baseline 的 `Set.has(code) \|\| owned.has('*')` 已足够覆盖"接口级权限"诉求;CASL 引入需要额外学习成本与 Ability 表达式版本管理,与 baseline "最小可用"原则不符 |
| 派生项目什么时候可以做 | ① 出现"按字段级"(如"普通员工只看脱敏后的手机号")或"按记录条件"(如"销售只看自己负责的客户")的复杂规则;② baseline 的两段式权限码已无法清晰表达;③ 客户提"权限要按表达式后台可配" |
| 解锁前必须确认 | 是不是真表达式级,还是"再加一两条权限码就够";Ability 写代码还是写 DB;CASL Subject / Action / Condition 三元组的语义边界;是否联动 B-14 数据级权限 |
| 是否需要 migration | ⚠️ 若 Ability 表达式存 DB 需要(`AbilityRule` 表) |
| 是否需要测试 | ✅ E2E 覆盖每条 Ability 表达式 + 单测覆盖 CASL Subject / Action / Condition |
| 是否需要更新 OpenAPI contract | ⚠️ 若新增 Ability 管理接口需要 |
| 解锁后需更新的文档 | 派生项目 `CLAUDE.md` 底部追加 CASL 规则段;`docs/ability-model.md` 新增;本矩阵对应行状态 |
| 不变式声明(实施后仍保留) | 全局 `APP_GUARD` 注册顺序、`@Public()` / `@Permissions(...)` 互斥、`JwtPayload` 最小化、五条 super_admin 铁律、permission code 仍是代码契约(CASL 表达式之外的固定权限码不变) |
| 当前派生项目状态 | 🔒 未解锁 |

### B-1-archived — RBAC / permission 表 / 按钮级权限(已退役,v2.0 baseline 覆盖)

| 字段 | 内容 |
|---|---|
| 类别 | BL(v2.0 baseline 已覆盖) |
| 模板原文位置 | `ARCHITECTURE.md` §12 / `docs/adr/ADR-001-v2-rbac-auth-baseline.md` §4 |
| 退役原因 | v2.0 baseline 把 `User → Role → Permission` 四表 + `@Permissions` + `PermissionsGuard` + 三个种子角色 + 七条种子权限纳入模板必备能力;派生项目自动继承,**不再需要单独写 ADR** |
| 当前派生项目状态 | 🟢 baseline-covered(自动启用) |
| 派生项目可在 baseline 之上扩展什么 | 增删非系统角色;调整 `admin` / `user` 角色的权限关联;新增业务权限码(按 `<resource>:<action>` 两段式严格命名);更高级能力走 B-1(CASL)/ B-12-15 |

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

### B-7-archived — refresh token 主体(已退役,v2.0 baseline 覆盖)

| 字段 | 内容 |
|---|---|
| 类别 | BL(v2.0 baseline 已覆盖) |
| 模板原文位置 | `ARCHITECTURE.md` §12 / `docs/adr/ADR-001-v2-rbac-auth-baseline.md` §4.7 |
| 退役原因 | v2.0 baseline 把短 TTL access(15m)+ 长 TTL refresh(7d)+ `RefreshToken` 表 + `tokenHash` sha256 存储 + rotation 强制 + 单 session logout 纳入模板必备能力 |
| 当前派生项目状态 | 🟢 baseline-covered(自动启用) |
| 派生项目可在 baseline 之上扩展什么 | 调整 `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN`;baseline 之外的更高级能力走 B-7 残余 |

### B-7 — refresh token 残余能力(token 主动吊销 / family / 异常重放全链路吊销)

| 字段 | 内容 |
|---|---|
| 类别 | B(默认禁止,ADR 解锁) |
| 模板原文位置 | `CLAUDE.md` §1 / `AGENTS.md` §1 / `docs/adr/ADR-001-v2-rbac-auth-baseline.md` §9.2 / §7.3 |
| baseline 已覆盖 | refresh token + logout + rotation + 哈希存储 + 单 token 重放检测(已 `revokedAt` 的 token 再次使用 → 抛 `UNAUTHORIZED`) |
| baseline **未**覆盖(本条解锁范围) | ① **Access token 主动吊销**(blacklist);② **Refresh token family / reuse detection 全链路吊销**(被盗检测后吊销该 family 全部 token);③ **重置密码同步吊销该用户全部 refresh token**;④ **Refresh token 撤销列表**(集中查询所有活跃 session) |
| 派生项目什么时候可以做 | ① 真出现 refresh token 被盗风险需要全链路回收;② 管理员重置密码必须立即吊销旧 access(不接受短 TTL 窗口);③ 客户端需要"查看所有活跃 session 并选择性踢出" |
| 解锁前必须确认 | access 黑名单走 Redis(联动 B-10)还是 DB;family 模型(`parentTokenId` / `familyId`)字段设计;reuse detection 触发后是否通知用户;重置密码后吊销选项是开发态还是用户配置 |
| 是否需要 migration | ✅ `RefreshToken` 表加 `parentId` / `familyId` 字段(family 模型);可能新增 `AccessTokenBlacklist` 表(若不走 Redis) |
| 是否需要测试 | ✅ 重置密码后旧 access token 立即失效;family 异常重放全链路回收;并发刷新场景;active sessions 列表 / 单 session 强制吊销 |
| 是否需要更新 OpenAPI contract | ✅ 若新增 `GET /api/auth/sessions` / `DELETE /api/auth/sessions/:id` |
| 解锁后需更新的文档 | `docs/security.md` "Token 吊销升级路径"状态;`CLAUDE.md` §18.3 / `AGENTS.md` §18.3 对应行加 ADR 引用 |
| 不变式声明(实施后仍保留) | `JwtPayload` 最小化(`{ sub, username, typ, jti }`,不塞 roles / permissions);防账号枚举四场景;refresh token 哈希存储(永久红线第 11 条);logout 单 session 语义(ADR-001 §9.3);五条 super_admin 铁律 |
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

### B-12 — 部分通配权限(`user:*` / `*:read`)

| 字段 | 内容 |
|---|---|
| 类别 | B(默认禁止,ADR 解锁) |
| 模板原文位置 | `CLAUDE.md` §1 / `AGENTS.md` §1 / `docs/adr/ADR-001-v2-rbac-auth-baseline.md` §4.6 / §7.3 |
| 模板为什么不做 | baseline 仅支持全权 `*` 通配,部分通配会让权限计算复杂(需要在 Guard 内做 glob 匹配),且容易让派生项目滥用通配掩盖真实权限边界 |
| 派生项目什么时候可以做 | ① 业务权限码数量超过 20 条,某些角色需要"该资源全部操作"或"全系统读"时;② 复杂中后台权限分组 |
| 解锁前必须确认 | 通配规则的精确语法(glob? 正则?);是否允许多级通配(`*:*`);通配权限的 audit log;通配与超级用户 `*` 的区分 |
| 是否需要 migration | ❌ 通常无,Permission 表已支持任意 code 字符串 |
| 是否需要测试 | ✅ Guard 通配匹配单测 + 每条通配权限的 E2E |
| 是否需要更新 OpenAPI contract | ❌ 通常无 |
| 解锁后需更新的文档 | 派生项目 `CLAUDE.md` 底部追加通配规则段;本矩阵对应行状态 |
| 不变式声明(实施后仍保留) | 权限码命名仍是 `<resource>:<action>` 两段式(通配 `*` 出现在 `resource` 或 `action` 段);全权 `*` 仅 super_admin 拥有 |
| 当前派生项目状态 | 🔒 未解锁 |

### B-13 — `@AnyPermission(...)` OR 语义装饰器

| 字段 | 内容 |
|---|---|
| 类别 | B(默认禁止,ADR 解锁) |
| 模板原文位置 | `CLAUDE.md` §1 / `AGENTS.md` §1 / `docs/adr/ADR-001-v2-rbac-auth-baseline.md` §4.6 |
| 模板为什么不做 | baseline 仅 AND 语义;OR 装饰器易让权限判定语义模糊;真有 OR 诉求往往可以通过"拆成两个 endpoint""service 层手动判断"或"加一条聚合权限码"解决 |
| 派生项目什么时候可以做 | ① 某接口"持有 A 权限或 B 权限"任一即可访问,且拆 endpoint 不优雅;② 多角色共享接口但权限码不同 |
| 解锁前必须确认 | 与 `@Permissions` (AND) 是否互斥(同 endpoint 不能同时标);OR 与 super_admin `*` 的优先级;是否需要 `@AllPermissions` 显式别名(增强可读性) |
| 是否需要 migration | ❌ |
| 是否需要测试 | ✅ E2E 覆盖 OR 命中 / 全部缺失 / 部分缺失三种情况 |
| 是否需要更新 OpenAPI contract | ⚠️ Swagger 错误响应描述可能需要调整 |
| 解锁后需更新的文档 | 派生项目 `CLAUDE.md` 底部追加 OR 装饰器使用规则 |
| 不变式声明(实施后仍保留) | `@Public` 与 `@AnyPermission` 仍互斥(扩展永久红线第 8 条);Guard 注册顺序不变 |
| 当前派生项目状态 | 🔒 未解锁 |

### B-14 — 数据级 / 行级权限(`user:read:own` 之类)

| 字段 | 内容 |
|---|---|
| 类别 | B(默认禁止,ADR 解锁) |
| 模板原文位置 | `CLAUDE.md` §1 / `AGENTS.md` §1 / `docs/adr/ADR-001-v2-rbac-auth-baseline.md` §4 / §7.3 |
| baseline 行为 | `user:read` 看所有未软删用户;不按角色 / 部门过滤可见范围(v1 的 "ADMIN 仅看 USER" 在 v2.0 baseline 已取消) |
| 模板为什么不做 | 数据级权限规则与业务强耦合(按部门? 按创建者? 按客户归属?);baseline 一刀切会限制派生项目自由度 |
| 派生项目什么时候可以做 | ① 出现"ADMIN 只能管理自己创建的用户";② "ADMIN 仅看本部门成员";③ 客户提"按数据归属看数据"诉求 |
| 解锁前必须确认 | 数据归属字段(`createdBy` / `ownerId` / `orgId`);过滤逻辑放 controller 还是 service;是否联动 B-2(组织树)或 B-1(CASL);权限码命名(`user:read:own` 仍违反两段式红线!推荐改成 `user_own:read` 或单独走 CASL) |
| 是否需要 migration | ⚠️ 若需要 `User.createdBy` / `User.ownerId` 字段则需要 |
| 是否需要测试 | ✅ E2E 覆盖数据归属过滤的边界 |
| 是否需要更新 OpenAPI contract | ⚠️ 响应数据集变小,字段不变;若新增"看自己 vs 看全部"的子路径则需要 |
| 解锁后需更新的文档 | 派生项目 `CLAUDE.md` 数据权限段;`docs/data-permission.md` 新增 |
| 不变式声明(实施后仍保留) | 权限码命名 `<resource>:<action>` 两段式(若需要 `:own` 这种归属类后缀,改造为 `user_own` 虚拟资源);五条 super_admin 铁律;最后一个 active super_admin 保护 |
| 当前派生项目状态 | 🔒 未解锁 |

### B-15 — 角色继承(`parentRoleId`)/ 部门范围权限

| 字段 | 内容 |
|---|---|
| 类别 | B(默认禁止,ADR 解锁) |
| 模板原文位置 | `CLAUDE.md` §1 / `AGENTS.md` §1 / `docs/adr/ADR-001-v2-rbac-auth-baseline.md` §4 / §7.3 |
| baseline 行为 | 角色平铺,权限合并取并集;不支持角色继承,不支持按部门过滤权限 |
| 模板为什么不做 | 角色继承的合并规则(子覆盖父?并集?差集?)与业务强耦合;部门范围权限通常先要 B-2(组织树)解锁 |
| 派生项目什么时候可以做 | ① 内管系统出现"经理 = 普通员工 + 部门视图"的角色继承需求;② 客户提"权限按部门范围细分"且不能用 B-14 数据级权限替代 |
| 解锁前必须确认 | 继承规则(并集 / 覆盖);最大继承深度;是否需要 B-2 组织树先解锁;部门范围权限的存储方式(`RolePermission` 加 `scope` 字段?还是新表) |
| 是否需要 migration | ✅ `Role.parentId` 字段(自引用)+ 可能 `RolePermission.scope` 字段 |
| 是否需要测试 | ✅ E2E 覆盖角色继承合并 + 循环引用防护 |
| 是否需要更新 OpenAPI contract | ⚠️ 若需要"按部门拉取权限"接口 |
| 解锁后需更新的文档 | 派生项目 `CLAUDE.md` 角色继承段;`docs/role-inheritance.md` 新增;若联动 B-2 则同步 `docs/organization.md` |
| 不变式声明(实施后仍保留) | 三个 baseline 角色 `code` 不可改;权限码命名两段式;五条 super_admin 铁律(`super_admin` 不可作为任何角色的子角色) |
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
| "V1.1 不修改 prisma schema" | "**仅适用模板 V1.1 加固阶段**(已收尾,历史任务清单见 [`release-tasks/v1.1-engineering-hardening.md`](./release-tasks/v1.1-engineering-hardening.md))。派生项目修改 schema 是正常工作流(C 类)" |
| "V1.1 不修改 auth / users 业务路由" | "**仅适用模板 V1.1 加固阶段**。派生项目可扩展,守 A 类铁律" |
| `CLAUDE.md` §17.11 / `AGENTS.md` §17.10 "V1.1 完成后不要自动触发 §9 升级路径" | "派生项目里 §9 升级是正常工作流,通过 ADR 流程触发,不需要等模板再升级一次" |
| "不引入 `LocalStrategy`" | "已有 `username + password` 路径**不必**为统一抽象引入 LocalStrategy;新增登录策略时按 B-9 走 ADR,放 `strategies/<provider>.strategy.ts`" |

---

## §A 永久铁律清单(派生项目也必须保留)

按"违反后果严重程度"由重到轻排列。**任何 ADR 都不能削弱本节任一条目**。

> **v2.0 升级提示**:本清单从 v1 的 27 条扩展为 **29 条**(新增第 11 条 refresh token 哈希存储 + 第 26 条权限 code 不进字典 + 第 27 条权限码命名两段式)。部分原条目的表述按 v2.0 baseline 语义升级(第 3 / 7 / 8 / 9 条,详见标注),**实质语义不变,只是从 v1 单值 Role 升级到 v2.0 RBAC 等价物**。

### 安全底线类(违反直接导致漏洞)

1. `passwordHash` 永不出响应(`userSafeSelect` 不能漏)
2. 密码落库前必须 `bcrypt.hash()`(salt rounds=10)
3. `JwtPayload` 不塞 `roles` / `permissions` / 完整用户对象;权限判定走本次查库 _**(v2.0 升级:v1 表述为"不塞 role",v2.0 扩展为"不塞 roles / permissions";实质不变)**_
4. 登录失败四场景统一响应(`LOGIN_FAILED` / HTTP 401)+ Timing 防御(`bcrypt.compare(dummyHash)`)
5. 生产环境拒绝默认 `JWT_SECRET` / `APP_CORS_ORIGIN=*` / `SUPER_ADMIN_*` 默认值
6. 业务代码不直读 `process.env`,统一走 `*.config.ts`
7. 全局 `APP_GUARD` 注册(`JwtAuthGuard` → `PermissionsGuard`),禁止 controller 上 `@UseGuards(...)` _**(v2.0 升级:v1 表述为 `RolesGuard`,v2.0 替换为 `PermissionsGuard`;注册顺序不变)**_
8. `@Public()` 与 `@Permissions(...)` 互斥 _**(v2.0 升级:v1 表述为 `@Roles(...)`,v2.0 替换为 `@Permissions(...)`)**_
9. 五条 super_admin 铁律 + 最后一个活跃 super_admin 保护 + 自我保护(同事务内检查)_**(v2.0 升级:展开自 v1 "最后一个活跃 SUPER_ADMIN 保护 + 自我保护",详见 ADR-001 §4.5)**_
10. 日志 redact 清单(`password` / `newPassword` / `passwordHash` / `token` / `refreshToken` / `accessToken` / `secret` 等)命中字段必须 `[REDACTED]`,不能只做长度截断
11. **(v2.0 新增)** refresh token 哈希存储(sha256),不存明文;rotation 时旧 token 立即 `revokedAt`

### 契约稳定类(违反破坏前端 / 监控)

12. 统一响应格式 `{ code, message, data }`
13. BizCode 三字段对象(`code` / `message` / `httpStatus`)+ `BizException` 类型签名锁死
14. BizCode 段位规划(`4xxxx`/`5xxxx` 通用 / `100xx`+`101xx` users / `110xx`+ 后续模块每段 200 个号段)
15. Swagger 100% 覆盖,使用 `@ApiWrapped*` 装饰器
16. 响应拦截器跳过路径(`/api/docs` / `/api/docs-json` / `/metrics` / 文件下载流)
17. OpenAPI 契约快照(`pnpm test:contract`)+ E2E 测试(`pnpm test:e2e`)作为 CI 合并门槛
18. 健康检查向后兼容:`/api/health` 必须仍按 v1 契约返回 `{ code: 0, message: 'ok', data: { status: 'ok' } }`

### 工程一致性类(违反让 AI 写错)

19. pnpm-only,禁止 npm / yarn / bun
20. 全局 `ValidationPipe`(`whitelist` + `forbidNonWhitelisted` + `transform`)
21. 入参 / 出参 DTO 分离,**禁止 `*.entity.ts`**
22. 入参 DTO 字段白名单(`UpdateMyProfileDto` / `UpdateUserDto` 不允许字段透传)
23. 唯一性预检查用 `findUnique`(包含软删),业务详情查询用 `findFirst + notDeletedWhere`
24. 软删除走 `update({ deletedAt, status: DISABLED })`,**禁止** `prisma.user.delete()`
25. 已应用的 migration 不可改写,只能新增 migration 增量演进;`prisma migrate dev` 必须先说明再执行,生产只跑 `migrate deploy`
26. **(v2.0 新增)** 权限 code 是代码契约,**不进字典表**,后台无 create/update/delete 接口;baseline `Permission` 表是只读种子,后台不暴露写接口
27. **(v2.0 新增)** 权限 code 命名统一 `<resource>:<action>` 两段式,**不允许任何"唯一例外"**(`user_role:assign` 是把 user_role 当虚拟资源,不是三段式;`user:role:assign` 旧式三段写法已被本红线明确否决)

### 文档协作类(违反让 AI 在派生项目里迷路)

28. 派生项目不删改 `ARCHITECTURE.md` / `CLAUDE.md` / `AGENTS.md` 继承段落,优先追加;确需修改时先 ADR(见 [`derived-project-governance.md`](./derived-project-governance.md) §7)
29. ADR 文件不删,即使状态是 Rejected(保留决策历史)

### v1.x 维护分支的特殊处理

派生项目若仍维护 v1.x 分支(未升级到 v2.0),按以下方式读本节:

- 第 3 / 7 / 8 / 9 条按 v1 等价表述执行(`role` 单值 / `RolesGuard` / `@Roles(...)` / 最后一个 SUPER_ADMIN 保护 + 自我保护)
- 第 11 / 26 / 27 条 v1.x 分支**不适用**(没有 refresh token / 没有 Permission 表 / 没有权限码概念)
- v1.x 实际生效 26 条(v2.0 的 29 条减第 11 / 26 / 27 三条 v2.0 新增);v2.0+ 派生项目 29 条全部生效

---

## 3. 派生项目状态全表

派生项目立项时填写下表(本表是模板基线,派生项目应在自己仓库的副本里维护):

| 能力 | 类别 | 当前状态 | ADR 编号 | 备注 |
|---|---|---|---|---|
| **RBAC**(`User → Role → Permission` 四表) | **BL**(原 B-1) | 🟢 baseline-covered | ADR-001 | v2.0 baseline 已覆盖;派生项目自动继承 |
| **Refresh token + logout + rotation 主体** | **BL**(原 B-7 主体) | 🟢 baseline-covered | ADR-001 | v2.0 baseline 已覆盖;派生项目自动继承 |
| CASL / ability 表达式引擎(原 B-1 改造) | B-1 | 🔒 未解锁 | — | baseline `Set.has() + *` 已足够 |
| 组织树 / 多租户 | B-2 | 🔒 未解锁 | — | — |
| 文件上传 Provider | B-3 | 🔒 未解锁 | — | — |
| 附件元数据 | B-4 | 🔒 未解锁 | — | — |
| 字典管理 | B-5 | 🔒 未解锁 | — | — |
| 审计日志持久化 | B-6 | 🔒 未解锁 | — | — |
| refresh token 残余(access 黑名单 / family / 重放回收) | B-7 | 🔒 未解锁 | — | baseline 已覆盖 refresh + rotation + logout;残余能力联动 B-10 |
| 本人改密码 | B-8 | 🔒 未解锁 | — | v2.0 baseline 仍不做 |
| 微信 / 第三方登录 | B-9 | 🔒 未解锁 | — | — |
| Redis / 队列 / 定时 | B-10 | 🔒 未解锁 | — | — |
| LLM / 向量检索 | B-11 | 🔒 未解锁 | — | — |
| 部分通配权限(`user:*` / `*:read`) | B-12(v2.0 新增) | 🔒 未解锁 | — | baseline 仅全权 `*` 一档 |
| `@AnyPermission(...)` OR 装饰器 | B-13(v2.0 新增) | 🔒 未解锁 | — | baseline 仅 AND |
| 数据级 / 行级权限 | B-14(v2.0 新增) | 🔒 未解锁 | — | baseline 不按归属过滤 |
| 角色继承 / 部门范围权限 | B-15(v2.0 新增) | 🔒 未解锁 | — | baseline 角色平铺 |

---

> **维护提醒**:每次新增 ADR 时,更新本表对应行的状态与 ADR 编号;每解锁一项 B 类能力,同步更新各文档中对应的"未实现"段落(参见每条 B 类卡的"解锁后需更新的文档"行)。
