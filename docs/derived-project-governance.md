# 派生项目治理总则

> 本文是 **派生项目从模板演进的演进规则**,定位介于 [`ARCHITECTURE.md`](../ARCHITECTURE.md)(模板蓝图)与具体 ADR 之间。
>
> **适用对象**:从 `u-nest-api-starter` 通过 GitHub `Use this template` 派生出的业务项目(如 `u-rescue-api`、`u-studio-internal-api`、`u-mp-<biz>-api`、客户项目二开仓库)。
>
> **不适用对象**:`u-nest-api-starter` 模板仓库自身。模板仓库已于 `v0.1.7` 进入 freeze 模式(见 [`README.md`](../README.md)),只接受 docs / CI 路径的小幅调整,不堆叠业务模块。

---

## 1. 一句话定位

模板的核心铁律 **派生项目继续守住**;模板刻意砍掉的"未来再加"能力,**派生项目通过 ADR 流程依次解锁**。

派生项目里 AI 看到 v1 范围外的诉求时:
- **不能**直接拒绝(那是"AI 拒绝助手")
- **也不能**直接动代码(那会让派生项目失去可追溯性)
- 应当**先查本治理总则与能力解锁矩阵,再决定 ADR / 直接实施 / 拒绝**(成为"AI 决策助手")

---

## 2. 母模板 vs 派生项目

| 维度 | 母模板仓库(`u-nest-api-starter`) | 派生项目仓库 |
|---|---|---|
| 仓库定位 | "长期稳定的协作底座" | "真实业务系统" |
| 演进策略 | freeze 在 v0.1.7,只接受 docs / CI / release 元数据调整 | 按业务需求持续演进 |
| 业务模块 | 仅 `auth` / `users` / `health` 三个参考实现 + `ai/` 占位 | 按业务平铺新增(`orgs/` / `missions/` / `files/` 等) |
| Prisma schema | 不修改 | 通过 migration 增量演进 |
| `src/modules/auth/**` | 不修改 | 可扩展(新增登录策略、扩 JWT payload),保留安全不变式 |
| `src/modules/users/**` | 不修改 | 可扩展(`User` 加字段、加管理接口),保留安全不变式 |
| 继承文档(`ARCHITECTURE.md` / `CLAUDE.md` / `AGENTS.md`) | AI 不修改 | **默认不删改继承段落**,优先在文档底部追加"派生项目专属规则";确需修改时先有 ADR;**任何情况下不得削弱 A 类永久铁律** |
| CHANGELOG | 模板自身 v0.x release | 派生项目自己的 v0.1.0+ 计数(`README.md` 派生指南已说明) |
| ADR 目录 | 不需要 | 在 `docs/adr/` 维护,B 类能力解锁的产物 |

判断当前仓库类别(AI 启动时主动判断):

1. `package.json#name` 是 `u-nest-api-starter` → **模板仓库**(本文不适用)
2. `package.json#name` 是其他值 → **派生项目**(本文生效)
3. `README.md` 顶部含 "Template baseline: vX.Y.Z" + "template-freeze mode" 字样 → **模板仓库**

---

## 3. 规则分四类:A / B / C / D

模板里所有「禁止 / 不做 / 不得 / 绝不要碰」按下表分类。AI 与开发者读到任何禁止表述时,**必须先判断它属于哪一类,再决定行为**。

### A 类 — 永久铁律(派生项目也必须保留)

**判定标准**:与"AI 协作的底层契约"或"安全底线"绑定,改了就破坏整个底座可解释性或埋下安全漏洞。

A 类规则**派生项目不能放开**,任何 ADR **都不能削弱 A 类铁律**。

**代表项**(完整 27 条清单见 [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) §A):

- pnpm-only,禁止 npm / yarn / bun
- 统一响应格式 `{ code, message, data }`
- BizCode 三字段对象、`BizException` 类型签名锁死
- Swagger 100% 覆盖,使用 `@ApiWrapped*` 装饰器
- 全局 `ValidationPipe`(`whitelist` + `forbidNonWhitelisted` + `transform`)+ DTO 字段白名单
- 入参 / 出参 DTO 分离,禁止 `*.entity.ts`
- `passwordHash` 永不出响应,密码落库前必哈希
- 生产环境拒绝默认 `JWT_SECRET` / `APP_CORS_ORIGIN=*` / `SUPER_ADMIN_*` 默认值
- 业务代码不直读 `process.env`,统一走 `*.config.ts`
- 全局 `APP_GUARD` 注册,禁止 controller 上 `@UseGuards(...)`
- `JwtPayload` 最小化(仅 `sub` + `username`),角色判断走本次查库
- 登录防账号枚举四场景一致 + Timing 防御(`bcrypt.compare(dummyHash)`)
- `prisma migrate dev` 必须先说明再执行;生产只跑 `migrate deploy` 已审查 migration
- 最后一个活跃 SUPER_ADMIN 保护 + 自我保护
- 唯一性预检查用 `findUnique`(包含软删),业务详情查询用 `findFirst + notDeletedWhere`
- 响应拦截器跳过路径(`/api/docs` / `/api/docs-json` / `/metrics` / 文件下载流)
- OpenAPI 契约快照(`pnpm test:contract`)与 E2E 测试(`pnpm test:e2e`)作为合并门槛
- 已应用的 migration 不可改写(只能新增 migration 增量演进)

### B 类 — 默认禁止,可通过 ADR 解锁

**判定标准**:模板刻意砍掉以保持极简,但派生项目接到具体业务时可能必须做。属于"权限 / 容量 / 集成 / 第三方依赖"类升级,改动面较大,需要先有设计决策。

**所有 B 类能力**(11 项):

- RBAC / permission 表 / 按钮级权限
- 组织树 / 多租户
- 文件上传 Provider(本地 / OSS / R2 / COS / 七牛)
- 附件元数据表
- 字典管理
- 审计日志 / 操作日志(数据库持久化)
- refresh token / token 主动吊销
- 本人改密码接口
- 微信 / 小程序 / 第三方登录
- Redis / 队列 / 定时任务
- LLM / 向量检索 / pgvector

每项的解锁条件、影响范围、必填检查项见 [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) §B。

### C 类 — 派生项目正常业务能力(无需 ADR)

**判定标准**:模板没有禁止,只是基线没有内置;属于"业务平铺"性质,守住 A 类铁律即可直接做。

**所有 C 类能力**:

- 新增业务模块(`src/modules/orgs/` / `src/modules/missions/` / `src/modules/devices/` ...)
- 新增业务 Prisma model(对应 `prisma/schema.prisma` 增量)
- `User` 加普通业务字段(`phone` / `realName` / `birthday` / `orgId` 等,**不涉及权限模型变化**)
- 新增业务 DTO / Service / Controller(固定 4 文件结构)
- 新增业务 BizCode(按段位 `110xx`+ 平铺,每模块 200 个号段)
- 新增 E2E / contract / unit 测试
- 新增业务专属 docs(`docs/<biz>.md`、`docs/playbook-<biz>.md`)

**C 类不需要 ADR**,但仍需:
- 守住 A 类铁律(响应格式 / DTO 白名单 / BizCode 三字段 / Swagger 覆盖等)
- 走 Prisma migration 增量演进
- 同步更新 OpenAPI 契约快照(`pnpm test:contract -u`)
- 写 E2E 覆盖关键路径与权限边界

> **注意**:`User` 加 `role` 之外的角色相关字段(如 `permissions` / `roleIds`)**不属于 C 类**,属于 B-1 RBAC 解锁范围。

### D 类 — 表述过死,需要按条件性限制读

**判定标准**:文档原文用了绝对动词,但实际语义是"在某个阶段 / 某个仓库 / 某个条件下"才成立。

**典型对照**(完整对照表见 [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) §D):

| 模板原文 | 派生项目里如何读 |
|---|---|
| "AI 不得擅自补全 [B 类功能]" | "AI 先查本治理总则 + 矩阵 + `docs/adr/`,无 ADR 先暂停引导写,不直接拒绝" |
| "派生项目**绝不要碰** `src/modules/auth/**`" | "可扩展,但必须保留安全不变式(防账号枚举 / Timing 防御 / `JwtPayload` 最小化 / 全局 `APP_GUARD`)" |
| "派生项目**绝不要碰** `src/modules/users/**`" | "可扩展,但必须保留:`userSafeSelect` / 软删除 / 自我保护 / 最后一个 SUPER_ADMIN 保护 / `assertCanManageUser` 双层校验" |
| "v1 不提供恢复接口" | "派生项目按 [`docs/security.md`](./security.md) §软删除策略 给出的接口契约实施即可" |
| "不主动加用户状态缓存优化" | "未触发 `ARCHITECTURE.md` §9 升级条件前不加;触发后按 §9 + 写 ADR" |
| `CLAUDE.md` §17 / `AGENTS.md` §17 / `ARCHITECTURE.md` §11 的 V1.1 不修改清单 | "**仅适用模板 V1.1 加固阶段**(已收尾,见 `TASKS.md`)。派生项目无需遵守" |

---

## 4. AI 在派生项目中的决策流程

```
┌─────────────────────────────────────────────────────────┐
│ 用户提出业务需求                                          │
│ 例:救援队系统要"创建一个组织树,人员归属到中队"           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Step 1: 判断诉求是否触碰模板规则                          │
│ - 不触碰 → 按 A 类铁律 + 模板规范实施,正常开发           │
│ - 触碰   → 查 docs/capability-unlock-matrix.md           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Step 2: 在矩阵里查到对应行,判断类别                      │
│                                                          │
│ ▸ A 类(永久铁律)                                       │
│   → 拒绝并告知用户:这是底层契约,不能破坏                │
│   → 引导用户:有没有不破坏铁律的替代方案?                │
│                                                          │
│ ▸ B 类(默认禁止,ADR 可解锁)                            │
│   → 检查 docs/adr/ 是否已有相关 ADR                      │
│     ✓ 已有 → 按 ADR 实施                                 │
│     ✗ 无   → 暂停,先与用户共同写 ADR;不直接写代码        │
│                                                          │
│ ▸ C 类(派生项目正常业务)                                │
│   → 直接实施,守住 A 类铁律,更新测试与契约               │
│                                                          │
│ ▸ D 类(表述过死)                                        │
│   → 按矩阵 §D 对照表的"派生项目如何读"行动               │
│   → 通常等价于 B 类(走 ADR)或 C 类(直接做)             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Step 3: 实施前的标准动作                                  │
│ - 必要 migration 先说明,等用户确认再 prisma migrate dev │
│ - 新增 BizCode 按段位分配(模块号 + 0xx/1xx)             │
│ - DTO 走 forbidNonWhitelisted + 字段白名单                │
│ - 响应仍是 { code, message, data }                       │
│ - Swagger 走 @ApiWrapped* 装饰器                          │
│ - 写 E2E 覆盖新接口 + 权限边界                            │
│ - 更新 OpenAPI contract:pnpm test:contract -u           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Step 4: commit / PR                                      │
│ - commit 前缀建议 ADR-NNN:<topic> 或 feat: <模块>: <动作> │
│ - PR description 引用对应 ADR(若是 B 类解锁)             │
└─────────────────────────────────────────────────────────┘
```

**核心原则**:

- AI **不能**因为旧文档写了"不做"就拒绝业务开发——拒绝是 D 类表述问题,不是真实约束。
- AI **也不能**直接绕过文档硬上代码——A 类铁律永远不变,B 类必须先有 ADR。
- 没有 ADR 就开干 B 类能力,会让派生项目失去"为什么这么做"的可追溯性,半年后维护时无人能说清。

---

## 5. ADR(Architecture Decision Record)流程

ADR 是 B 类能力解锁的**前置必填**。写 ADR 的成本是 5 分钟,挡掉的是 5 周返工。

### 5.1 ADR 文件命名

```
docs/adr/NNN-<topic>.md
```

- `NNN` 从 `001` 起编号,与已有 ADR 顺延
- `<topic>` 用小写中横线,例如 `001-rbac-with-permission-table`、`002-orgs-tree`、`003-refresh-token`

### 5.2 ADR 模板

```markdown
# ADR-NNN: <一句话标题>

- 状态:Proposed | Accepted | Superseded by ADR-XXX | Rejected
- 立项日期:YYYY-MM-DD
- 决策者:<姓名 / 角色>

## 1. 背景与动机

<用 2-5 句说清:为什么现在要做这件事?哪个具体业务需求触发的?>

## 2. 涉及的模板规则

<列出本 ADR 触碰的模板原文位置,例如:>
- `CLAUDE.md` §1 "不做 RBAC"
- `ARCHITECTURE.md` §9 升级路径行 "真要做权限点到按钮级"
- `docs/capability-unlock-matrix.md` 行:B-1 RBAC

## 3. 候选方案

### 方案 A
- 优点:
- 缺点:
- 实现成本:

### 方案 B
- 优点:
- 缺点:
- 实现成本:

## 4. 决策

<选哪个方案?为什么?>

## 5. 影响范围

- Prisma schema:<是否新增表 / 字段;给出 schema 草案>
- migration:<会生成几个 migration;是否有数据回填>
- BizCode:<新增哪些 BizCode,段位如何分配>
- API:<新增 / 修改哪些接口路径与 HTTP 方法>
- DTO:<新增 / 修改哪些 DTO>
- 测试:<新增哪些 E2E spec / 单测>
- OpenAPI contract:<是否触发 snapshot 漂移,需要 pnpm test:contract -u>
- 文档:<需要同步更新哪些 docs/*.md>

## 6. 不变式声明

<本 ADR 实施后,仍然保留的 A 类铁律。例如:>
- 响应格式仍是 `{ code, message, data }`
- 最后一个活跃 SUPER_ADMIN 保护未变
- `passwordHash` 仍不出响应

## 7. 升级路径(向后)

<这个 ADR 如果未来要再升级,触发条件是什么?例如:>
- 当组织树超过 3 层 / 单个组织成员超过 1000 人时,考虑引入 Redis 缓存组织成员列表

## 8. 是否回流模板?

<本 ADR 实现的能力是否是"通用工程能力"应回流模板?还是"业务模块"留在派生项目?>
- 业务模块(orgs / missions / devices ...)→ **不回流**
- 通用能力(common utility / 安全加固 / 测试工具)→ **可考虑回流**,按模板 v0.x.y release 走 PR review
```

### 5.3 ADR 最小必填字段(给 AI 写时的检查清单)

- [ ] 背景:说清业务诉求
- [ ] 涉及的模板规则:列出原文位置,证明不是"无来由就开干"
- [ ] 决策:选哪个方案 + 为什么
- [ ] 影响范围:schema / migration / BizCode / API / 测试 / contract / 文档
- [ ] 不变式声明:本 ADR 实施后仍保留哪些 A 类铁律

不满足这五项的 ADR,AI 应提示用户补全,而非开始动代码。

---

## 6. 解锁后必须同步更新的内容

ADR Accepted 后,**实施代码的同时必须更新**:

| 类别 | 更新内容 |
|---|---|
| Prisma | `prisma/schema.prisma` + 新 migration 文件;`pnpm prisma:generate` 重新生成 Client |
| BizCode | `src/common/exceptions/biz-code.constant.ts` 按段位平铺新增,每项三字段(`code` / `message` / `httpStatus`) |
| OpenAPI 契约 | `pnpm test:contract -u` 更新 `test/contract/__snapshots__/openapi.contract-spec.ts.snap`,PR diff 里能直接 review |
| E2E | `test/e2e/<feature>.e2e-spec.ts` 覆盖典型成功路径 + 角色边界 + 错误响应 HTTP status & BizCode |
| 文档 | `docs/capability-unlock-matrix.md` 对应行的"派生项目状态"列从 `🔒 未解锁` 改为 `✅ 已解锁 (ADR-NNN)` |
| 路由总览 | `docs/development.md` 路由总览表追加新接口 |
| CHANGELOG | 派生项目自己的 CHANGELOG,记录解锁了哪个能力、对应哪个 ADR |

---

## 7. 派生项目对继承文档的修改规则

派生项目继承的 `ARCHITECTURE.md` / `CLAUDE.md` / `AGENTS.md` / `docs/security.md` / `docs/development.md` / `docs/testing.md` / `docs/deployment.md` 等模板文档,**按以下分级处理**:

### 7.1 默认规则

- **不删改**模板继承段落
- **优先**通过追加"派生项目专属规则"覆盖(在文档底部新增章节,如 `## 派生项目专属规则` 或 `## XX 业务补充`)
- 这样做的好处:模板未来如有规范升级,派生项目能 `git pull --rebase` 或人工对比,继承段落不冲突

### 7.2 确需修改继承段落时

如果追加方式无法表达(例如要把"v1 不做 RBAC"改成"派生项目按 ADR-001 已解锁 RBAC"),按以下流程:

1. **必须先有 ADR**:在 `docs/adr/` 写一条对应的 ADR,状态 Accepted
2. **修改时显式标注来源**:在被修改的段落旁边加 `<!-- 派生项目自定义,见 ADR-NNN -->` 注释
3. **不删除原文**:推荐改成"模板原文:XXX;派生项目按 ADR-NNN 调整为:YYY"两段并列,便于后续 review

### 7.3 永远不允许的修改

无论是否有 ADR,**永远不得**:

- 删除或削弱 A 类永久铁律(参见 §3 A 类清单与 [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) §A 完整 27 条)
- 删除 [`docs/security.md`](./security.md) "已落地策略"表中的任何条目
- 删除 [`docs/security.md`](./security.md) 日志 redact 清单
- 修改已应用 migration 的内容(只能新增 migration 增量演进)
- 修改模板已分配的 BizCode 数字(前端 SDK 在用)

---

## 8. AI 在派生项目里的禁区

无论项目阶段如何,AI **永远**不能做以下事情(即使用户当场要求,也应先停下确认):

1. 破坏 A 类铁律(参见 §3 A 类清单)
2. 修改已应用的 migration 文件
3. 在响应体里暴露 `passwordHash`
4. 把 `JWT_SECRET` / `SUPER_ADMIN_PASSWORD` 等敏感值硬编码进代码
5. 在生产 `APP_ENV=production` 上跑 `prisma migrate dev`
6. 用 `prisma.user.delete()` 物理删用户(违背软删除策略)
7. 引入 npm / yarn / bun(违背 pnpm-only)
8. 让入参 DTO 缺失 `class-validator` 装饰器
9. 让 `@Public()` 与 `@Roles(...)` 同时出现在同一接口
10. 在 controller 上 `@UseGuards(...)`(应走全局 `APP_GUARD`)
11. 用户明确要求"绕过 ADR 直接实施 B 类能力"时,AI 应再次提示 5 分钟 ADR 成本与可追溯性价值;若用户仍坚持,**应在实施 commit 与 PR description 里显式记录"未走 ADR"**,而非默默动手

这些是"做了就要回滚 + 写事故复盘"的级别。

---

## 9. 何时把改动回流模板?

派生项目跑出**共性问题**(规范遗漏、铁律说不清、common utility 缺失)时,按 [`ARCHITECTURE.md`](../ARCHITECTURE.md) §9 评估是否回流。

| 改动类别 | 是否回流模板 |
|---|---|
| 业务模块(`orgs/` / `missions/` / `devices/` ...) | ❌ 不回流 |
| 业务表 / 业务 BizCode / 业务接口 | ❌ 不回流 |
| 通用 common utility(新装饰器 / 新拦截器 / 新 guard 模板) | ⚠️ 评估后回流,作为模板 v0.x.y release |
| 文档规范遗漏(铁律没说清、新冒出的"AI 容易写错"场景) | ✅ 优先回流(本身就是模板的核心价值) |
| ADR 流程改进(更好的模板 / 更清晰的字段) | ✅ 优先回流 |

回流流程:在模板仓库提 PR,走 review,打 tag,写 CHANGELOG。**派生项目自身不修改模板的 fork 副本**。

---

## 10. FAQ

### Q1: 派生项目可以删除模板里的某些铁律段落吗?

**默认不可以**。派生项目继承的 `CLAUDE.md` / `AGENTS.md` / `ARCHITECTURE.md` 是"模板规范"的引用。补充派生项目专属规则的优先方式是**追加在文档底部新章节**;确需修改继承段落必须先写 ADR(见 §7.2);**A 类永久铁律无论如何不能削弱**(见 §7.3)。

### Q2: 派生项目可以新增自己的 docs/ 子文档吗?

**可以,推荐**。例如 `docs/business-glossary.md`、`docs/playbook-rescue-team.md`、`docs/adr/` 等。模板 docs/ 文件(`development.md` / `testing.md` / `deployment.md` / `security.md`)**默认不改**,按 §7 规则处理;新增文件**自由**。

### Q3: 派生项目能否扩展 `Role` 枚举,加第四个角色?

**可以,属于 C 类**(枚举扩展,不是权限模型升级)。但要注意:
- 改 `prisma/schema.prisma` 的 `enum Role`,生成新 migration
- 同步更新 `assertCanManageUser`、用户列表可见范围、最后一个 SUPER_ADMIN 保护(若涉及"最高权限"角色)
- 不要把这当作 RBAC 替代品——如果业务真需要按钮级权限,走 ADR 引入 RBAC(B-1)

### Q4: 派生项目能否给 `User` 加 `phone` / `realName` 字段?

**可以,属于 C 类**。注意同步更新:
- `userSafeSelect` 加新字段 → `UserResponseDto` 加对应 `@ApiProperty`
- 创建 / 更新 DTO 的字段白名单
- 唯一性(如 phone 唯一)的 P2002 处理 → 加对应 BizCode(`PHONE_ALREADY_EXISTS` 落在 `users` 段位 `100xx`)

### Q5: 写了 ADR,但用户后来反悔不想做了,ADR 怎么处理?

ADR 状态改为 `Rejected`,加 `rejected_date` 与"为什么不做"段落。**不删 ADR 文件**——保留决策历史,未来再有人提出同诉求时能直接看到"上次为什么不做"。

### Q6: AI 怎么知道当前仓库是模板还是派生项目?

判断顺序见 §2 末尾。简言之:`package.json#name` + `README.md` 顶部 freeze 声明两条线索任一命中即可。

### Q7: B 类能力解锁后,模板规则与派生项目实际行为冲突怎么办?

按 §7.2 流程处理:在被修改的继承段落旁加 ADR 引用注释,并保留模板原文便于对比。或者更轻量的做法:模板文档不动,在派生项目底部新增章节明确"本派生项目已通过 ADR-NNN 解锁 [能力],对模板 [位置] 的处理调整为 [新规则]"。

---

## 11. 与其他文档的关系

| 文档 | 关系 |
|---|---|
| [`ARCHITECTURE.md`](../ARCHITECTURE.md) | v1 蓝图,本治理总则**不替代** ARCHITECTURE。所有命名 / 模块 / 错误码 / 安全规则仍以 ARCHITECTURE 为最高优先级 |
| [`CLAUDE.md`](../CLAUDE.md) / [`AGENTS.md`](../AGENTS.md) | AI 协作铁律;本治理总则给铁律加"派生项目语义"上下文 |
| [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) | 本治理总则的"配套字典",列出每个 B 类能力的具体解锁条件 |
| [`security.md`](./security.md) | 已落地安全策略;本治理总则不覆盖 |
| [`development.md`](./development.md) / [`testing.md`](./testing.md) / [`deployment.md`](./deployment.md) | 操作手册;本治理总则不覆盖 |
| `docs/adr/`(派生项目维护) | 本治理总则要求的产物,每个 B 类解锁对应一篇 |

**冲突时优先级**:

1. [`ARCHITECTURE.md`](../ARCHITECTURE.md)(蓝图)
2. [`CLAUDE.md`](../CLAUDE.md) / [`AGENTS.md`](../AGENTS.md)(AI 铁律)
3. 本文(派生治理总则)
4. [`capability-unlock-matrix.md`](./capability-unlock-matrix.md)
5. 派生项目自有 ADR
6. 派生项目其他 docs

---

> **本文是派生项目长期演进的护栏,不是一次性的发布说明。每次新增 ADR 时,回头检查本文是否需要更新 §3 分类或 §4 流程。**
