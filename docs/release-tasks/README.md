# Release Tasks — 历史阶段任务归档

本目录归档**已完成阶段的任务清单 / 收尾报告 / 评估文档**。

---

## 1. 目录定位

- 这些文件是**历史快照**,**不再代表当前执行任务**,也**不再是规则约束**
- 文档中保留的旧命令、旧分支名、旧测试数字、旧版本 tag 是**历史事实**,**不要按字面回退执行**
- 文档内部的相对路径链接可能因归档移位而失效,内容以历史快照为准

## 2. 当前长期规则的唯一来源

| 角色 | 文档 |
|---|---|
| 模板蓝图 / 规则唯一来源 | [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) |
| 通用 AI Agent 协作铁律 | [`../../AGENTS.md`](../../AGENTS.md) |
| Claude Code 协作铁律 | [`../../CLAUDE.md`](../../CLAUDE.md) |
| 项目入口 + 派生指南 | [`../../README.md`](../../README.md) |
| 操作手册 | [`../development.md`](../development.md) / [`../testing.md`](../testing.md) / [`../deployment.md`](../deployment.md) / [`../security.md`](../security.md) |
| 派生项目治理 | [`../derived-project-governance.md`](../derived-project-governance.md) + [`../capability-unlock-matrix.md`](../capability-unlock-matrix.md) |
| 派生项目 ADR 目录骨架 | [`../adr/`](../adr/) |

## 3. 当前模板状态

以 [`README.md`](../../README.md) 顶部 `Template baseline` 与 `template-freeze mode` 声明为准。

## 4. 已归档文件

| 文件 | 对应阶段 / 版本 | 原路径 | 说明 |
|---|---|---|---|
| [`v1.1-engineering-hardening.md`](./v1.1-engineering-hardening.md) | V1.1 工程加固(v0.1.1) | 仓库根 `TASKS.md` | 9 个任务全部 ✅,模板已 freeze,本文件不再作为当前执行清单 |
| [`v0.1.3-final-report.md`](./v0.1.3-final-report.md) | V1.2 模板收敛(v0.1.3) | 仓库根 `FINAL_REPORT.md` | 收尾报告快照,含历史 branch 名与历史 commit 建议 |
| [`v1.3-contract-hardening-plan.md`](./v1.3-contract-hardening-plan.md) | V1.3 契约硬化(v0.1.4) | `docs/v1.3-plan.md` | 计划已全量实施,见 `CHANGELOG.md` v0.1.4 |
| [`v1.4-prisma7-evaluation.md`](./v1.4-prisma7-evaluation.md) | V1.4 Prisma 7 评估(v0.1.5) | `docs/v1.4-prisma7-evaluation.md` | 结论"不升级",未来若重启评估可直接参考 |

## 5. 为什么不删

- **审计可追溯**:派生项目复用模板时,可回看"为什么模板这么演进、哪些方案被讨论过"
- **决策历史**:这些文档承载了"为什么不做某能力"的当年理由,删除会让派生项目 AI 重复同样的讨论
- **代码内引用**:仓库内 `src/**` / `test/**` / `.github/workflows/ci.yml` 等位置保留少量旧路径引用(如 `// V1.1 TASKS.md 15.7`),作为代码上下文标签;移动后旧引用通过本目录索引仍可定位到归档文件

## 6. 如何往本目录新增归档

当模板自身经历下一轮 release 收尾(罕见,因模板已 freeze)、或派生项目需要把自身收尾报告归档时,把对应文档移到本目录,**在文件顶部追加归档说明**(声明历史快照定位、原路径、当前规则来源),并在本文件 §4 表格中追加一行。
