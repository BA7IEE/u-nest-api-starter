# AI 入口速查

> 本文是 AI 新会话进入仓库后的导航页,**不是新的规则来源**。
>
> 规则冲突时,按 [`README.md`](../README.md) / [`ARCHITECTURE.md`](../ARCHITECTURE.md) / [`CLAUDE.md`](../CLAUDE.md) / [`AGENTS.md`](../AGENTS.md) / [`derived-project-governance.md`](./derived-project-governance.md) / [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) 中既有优先级处理(见本文 §8)。
>
> 本文只回答两个问题:**当前仓库是什么?这次任务我该读哪些文档?**

---

## 1. 30 秒判断:当前仓库是什么?

| 判断项 | 模板仓库 | 派生项目 |
|---|---|---|
| `package.json#name` | `u-nest-api-starter` | 非 `u-nest-api-starter`(如 `u-rescue-api`) |
| `README.md` 顶部 | 含 `Template baseline: vX.Y.Z` + `template-freeze mode` | 通常已替换为业务项目说明 |
| 代码策略 | **不新增业务模块**,只接受 docs / CI / release metadata 小修 | 按业务演进,平铺加 `src/modules/<biz>/` |
| schema 策略 | **不改** `prisma/schema.prisma` | 走 `prisma migrate dev` 增量演进 |
| 规则入口 | [`README.md`](../README.md) → [`ARCHITECTURE.md`](../ARCHITECTURE.md) → [`CLAUDE.md`](../CLAUDE.md) / [`AGENTS.md`](../AGENTS.md) | 上述四份 + [`derived-project-governance.md`](./derived-project-governance.md) + [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) + [`docs/adr/`](./adr/) |

**判断顺序**:

1. 先看 `package.json#name`
2. 再确认 `README.md` 顶部是否仍含 freeze 声明
3. 命中"模板仓库"→ 本次任务只能动 docs / CI / release metadata(见本文 §3)
4. 命中"派生项目"→ 进入 §4 A/B/C/D 决策

判定细则:[`derived-project-governance.md`](./derived-project-governance.md) §2、[`CLAUDE.md`](../CLAUDE.md) / [`AGENTS.md`](../AGENTS.md) 顶部"派生项目快速指引"。

---

## 2. 我现在该读哪些文档?

按当前任务对照下表。**先读 → 再读** 是建议顺序,**不要先读** 是常见的"读了反而误导"陷阱。

| 当前任务 | 先读 | 再读 | 不要先读 |
|---|---|---|---|
| 初次进入模板仓库 | [`README.md`](../README.md) 顶部 freeze 声明 | [`ARCHITECTURE.md`](../ARCHITECTURE.md) §1-§4 | `release-tasks/`(历史快照,不代表当前规则) |
| 准备修改模板**文档** | [`README.md`](../README.md) 必读文档表 | 目标文档自身 | `src/` / `prisma/` |
| 准备修改模板**代码** | 本文 §3 模板仓库工作边界 | [`ARCHITECTURE.md`](../ARCHITECTURE.md) + [`CLAUDE.md`](../CLAUDE.md) / [`AGENTS.md`](../AGENTS.md) 全文 | 派生治理文档(模板里不适用) |
| 派生项目立项第一天 | [`README.md`](../README.md) "派生新项目"章节 | [`derived-project-governance.md`](./derived-project-governance.md) §2-§4 + [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) 派生项目状态全表 | [`release-tasks/v1.1-engineering-hardening.md`](./release-tasks/v1.1-engineering-hardening.md)(派生项目不适用) |
| 派生项目新增**普通业务模块** | [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) §C(C 类清单) | [`ARCHITECTURE.md`](../ARCHITECTURE.md) §3 / §6 / §7 模块结构与命名铁律 | `release-tasks/` |
| 派生项目触碰 RBAC / 多租户 / 文件上传 / 字典 / 审计 / refresh token / 改密码 / 小程序登录 / Redis / LLM | [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) §B 对应卡片 | [`docs/adr/`](./adr/) 是否已有相关 ADR | 直接动 `src/` |
| 写 ADR | [`adr/README.md`](./adr/README.md) | [`adr/000-template.md`](./adr/000-template.md) + [`derived-project-governance.md`](./derived-project-governance.md) §5 | 复制其它派生项目的 ADR(决策上下文不同) |
| 查历史阶段任务 / 旧 commit 注释里的 `TASKS.md 15.x` | [`release-tasks/README.md`](./release-tasks/README.md) §4 索引表 | 对应归档文件顶部说明 | 把归档文件当成"当前任务清单"按字面执行 |
| 排查 API 合同 / Swagger / mock 问题 | [`development.md`](./development.md) | [`testing.md`](./testing.md) contract 章节 + [`ARCHITECTURE.md`](../ARCHITECTURE.md) §7.4 | — |
| 排查生产部署 / migration 问题 | [`deployment.md`](./deployment.md) | [`ARCHITECTURE.md`](../ARCHITECTURE.md) §10 + [`security.md`](./security.md) | `prisma migrate dev`(生产环境禁止) |

---

## 3. 模板仓库工作边界

**仅当本仓库是模板**(`package.json#name === u-nest-api-starter` 且 README 顶部含 freeze 声明)时本节生效。

| 可以做 | 不可以做 |
|---|---|
| `docs/**` 小幅修正(措辞 / 链接 / 表格补全) | 新增业务模块(`src/modules/<biz>/`) |
| `.github/workflows/**` trigger 路径 / 缓存 key 小幅修正 | 修改 `prisma/schema.prisma` / 新增 migration |
| `package.json` 的 release metadata(`version` / `description`)在用户明确要求下 | 实施任意 B 类能力(见本文 §5) |
| 明确用户要求下的规则文档调整(必须先说清动机) | 修改已应用 migration |
| 新增模板自身演进的 docs(如本文、初始化清单) | 把派生项目的具体业务需求"顺手"在模板里实现 |

依据:[`README.md`](../README.md) 顶部 freeze 声明、[`derived-project-governance.md`](./derived-project-governance.md) §2(母模板 vs 派生项目对照表)。

---

## 4. 派生项目 A/B/C/D 决策速查

仅适用于**派生项目**。模板仓库不需要走这套决策。

| 类别 | 含义 | AI 行为 | 规则来源 |
|---|---|---|---|
| **A** | 永久铁律(共 27 条) | **拒绝破坏**,引导用户寻找不破坏铁律的替代方案;任何 ADR 都不能削弱 | [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) §A |
| **B** | 默认禁止,可通过 ADR 解锁(共 11 项) | 先查 [`docs/adr/`](./adr/) 是否已有相关 ADR;**无 → 暂停,引导用户写 ADR,不直接动代码** | [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) §B |
| **C** | 派生项目正常业务能力 | **直接实施**,守住 A 类铁律,同步更新测试 / Swagger / contract | [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) §C |
| **D** | 表述过死(模板原文绝对动词,派生项目语义不同) | 按对照表翻译,通常归属为 B 或 C 行为 | [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) §D |

完整决策流程图(4-Step):[`derived-project-governance.md`](./derived-project-governance.md) §4。

---

## 5. B 类能力一行索引

只给一行说明 + 指针,**详细解锁条件 / 影响范围 / 不变式声明见对应卡片**。

| 编号 | 能力 | 一行说明 | 详细卡片 |
|---|---|---|---|
| B-1 | RBAC / permission 表 / 按钮级权限 | 三层 `Role` 之外的细粒度权限点 | [`matrix.md` §B-1](./capability-unlock-matrix.md) |
| B-2 | 组织树 / 多租户 | 组织层级 / 跨租户隔离 | [`matrix.md` §B-2](./capability-unlock-matrix.md) |
| B-3 | 文件上传 Provider | 本地 / OSS / R2 / COS / 七牛 具体实现 | [`matrix.md` §B-3](./capability-unlock-matrix.md) |
| B-4 | 附件元数据表 | `Attachment` 表或业务侧附件元信息 | [`matrix.md` §B-4](./capability-unlock-matrix.md) |
| B-5 | 字典管理 | 后台可配枚举 | [`matrix.md` §B-5](./capability-unlock-matrix.md) |
| B-6 | 审计日志 / 操作日志(数据库持久化) | `AuditLog` 表;V1.1 结构化日志不算 | [`matrix.md` §B-6](./capability-unlock-matrix.md) |
| B-7 | refresh token / token 主动吊销 | `tokenVersion` 或 `RefreshToken` 表 | [`matrix.md` §B-7](./capability-unlock-matrix.md) |
| B-8 | 本人改密码接口 | `PUT /api/users/me/password` | [`matrix.md` §B-8](./capability-unlock-matrix.md) |
| B-9 | 微信 / 小程序 / 第三方登录 | `wx.login` / OAuth / OIDC | [`matrix.md` §B-9](./capability-unlock-matrix.md) |
| B-10 | Redis / 队列 / 定时任务 | BullMQ / Bee-Queue / Redis 缓存 | [`matrix.md` §B-10](./capability-unlock-matrix.md) |
| B-11 | LLM / 向量检索 / pgvector | 填充 `modules/ai/` 占位 | [`matrix.md` §B-11](./capability-unlock-matrix.md) |

派生项目立项时应通读一次,在 [`capability-unlock-matrix.md` §3](./capability-unlock-matrix.md) 派生项目状态全表里标 🟡 / ✅ / ⛔。

---

## 6. AI 高频反模式 Top 10

以下反模式**全部从现有规则文档提炼**,本文不新增规则;每条标出依据,违反时按依据条款回退。

| # | 反模式 | 依据 |
|---|---|---|
| 1 | 在模板仓库直接新增业务模块 / 修改 Prisma schema | [`README.md`](../README.md) 顶部 freeze 声明、[`derived-project-governance.md`](./derived-project-governance.md) §2 |
| 2 | 在派生项目里看到"v1 不做"就直接拒绝业务需求 | [`derived-project-governance.md`](./derived-project-governance.md) §1 / §4、[`CLAUDE.md`](../CLAUDE.md) §1 "派生项目快速指引" |
| 3 | 跳过 ADR 直接实现 B 类能力 | [`derived-project-governance.md`](./derived-project-governance.md) §4(Step 2 B 类分支)、§5、§8 第 11 项 |
| 4 | 修改已应用的 migration(`prisma/migrations/<已应用>/**`) | [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) §A 第 24 条、[`derived-project-governance.md`](./derived-project-governance.md) §7.3 |
| 5 | 用 `npm` / `yarn` / `bun` 代替 `pnpm` 装包或跑脚本 | [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) §A 第 18 条、[`CLAUDE.md`](../CLAUDE.md) §0、[`AGENTS.md`](../AGENTS.md) §0 |
| 6 | 业务代码手写 `{ code, message, data }` 外层响应 | [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) §A 第 11 条、[`CLAUDE.md`](../CLAUDE.md) §4、[`ARCHITECTURE.md`](../ARCHITECTURE.md) §7.3 |
| 7 | 自创临时 BizCode 或 `throw new BizException(10099)` 裸数字 | [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) §A 第 12 条、[`CLAUDE.md`](../CLAUDE.md) §5 "BizException 类型签名锁死" |
| 8 | 让 `passwordHash` 出现在响应 DTO / 接口响应 | [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) §A 第 1 条、[`CLAUDE.md`](../CLAUDE.md) §9 / §11、[`ARCHITECTURE.md`](../ARCHITECTURE.md) §7.7 / §7.9 |
| 9 | 业务代码 / service 直接 `process.env.XXX` 而不走 `*.config.ts` | [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) §A 第 6 条、[`CLAUDE.md`](../CLAUDE.md) §14 |
| 10 | `prisma migrate dev` 前未说明将生成 / 执行的 migration 内容就直接跑 | [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) §A 第 25 条、[`CLAUDE.md`](../CLAUDE.md) §0、[`ARCHITECTURE.md`](../ARCHITECTURE.md) 附录"实施规则" |

更多反模式见 [`derived-project-governance.md`](./derived-project-governance.md) §8(11 项禁区)与 [`CLAUDE.md`](../CLAUDE.md) §17.9 / [`AGENTS.md`](../AGENTS.md) §17.8 V1.1 "禁止顺手做"清单。

---

## 7. 开工前最低检查

按当前仓库类型选一段。

### 7.1 模板仓库

- [ ] 当前分支不是 `main`(除非只是只读浏览)
- [ ] PR 目标清楚:本次改动只动 `docs/**` / `.github/workflows/**` trigger / release metadata 任一项
- [ ] **不碰** `src/**` / `test/**` / `prisma/**` / `package.json` / `pnpm-lock.yaml` / 工作流逻辑(除非用户明确要求)
- [ ] 改动前先 `git status` 确认工作区干净
- [ ] 改动涉及规则文档(`ARCHITECTURE.md` / `CLAUDE.md` / `AGENTS.md`)时,先说明动机,等用户确认再动手

### 7.2 派生项目

- [ ] 已经判断需求属于 A / B / C / D 哪一类(按本文 §4)
- [ ] 涉及 B 类时先查 [`docs/adr/`](./adr/) 是否已有 Accepted 状态的 ADR;**无 → 暂停先写 ADR**
- [ ] 涉及 schema 改动时,先口头说明 migration 内容,等用户确认再 `prisma migrate dev`
- [ ] 涉及 API 合同(新增 / 改入参 / 改出参 / 改 HTTP 方法)时,同步更新 Swagger 装饰器 + `pnpm test:contract -u` + 新增 E2E
- [ ] 涉及权限边界时,E2E 覆盖**正路径(允许)+ 反路径(拒绝)**,断言 HTTP status 与 BizCode 同时一致
- [ ] 新增 BizCode 时按段位平铺(模块号 + `00xx` 业务 / `01xx` 边界),每项三字段(`code` / `message` / `httpStatus`)必填

---

## 8. 冲突时按哪个文档为准?

| 冲突类型 | 优先级 |
|---|---|
| 模板核心规则冲突 | [`ARCHITECTURE.md`](../ARCHITECTURE.md) 优先 |
| AI 执行规则与蓝图冲突 | [`CLAUDE.md`](../CLAUDE.md) / [`AGENTS.md`](../AGENTS.md) 与 [`ARCHITECTURE.md`](../ARCHITECTURE.md) 对齐;**冲突时以 ARCHITECTURE 为准** |
| 派生项目治理问题 | [`derived-project-governance.md`](./derived-project-governance.md) + [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) |
| B 类能力解锁的具体落地 | 派生项目自有 **ADR** > [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) §B 对应卡片 > 其它 `docs/*.md` 通用描述 |
| 历史阶段任务(如 `<v1.1 任务清单>`、`v0.1.3-final-report`) | [`release-tasks/`](./release-tasks/) **只作历史参考,不作为当前任务**;以归档说明 + 当前规则文档为准 |
| 本文与规则文档冲突 | 以规则文档为准,改本文(见 §9) |

完整优先级链(6 级):[`derived-project-governance.md`](./derived-project-governance.md) §11。

---

## 9. 本文维护规则

- 本文只做**导航**,不是新规则源
- **不**新增铁律、不新增 B 类能力、不新增 ADR 流程
- **不**替代 [`derived-project-governance.md`](./derived-project-governance.md) / [`capability-unlock-matrix.md`](./capability-unlock-matrix.md) / [`CLAUDE.md`](../CLAUDE.md) / [`AGENTS.md`](../AGENTS.md);它们才是规则
- 本文如与上述规则文档冲突,**应修本文**(以规则文档为准)
- 新增 B 类能力 / 新增 ADR / 调整 A 类铁律 → 改 matrix / governance / ADR,**而不是改本文**
- 本文只在 §2 文档导航表 / §5 B 类索引 / §6 反模式依据有结构性变化时同步更新
