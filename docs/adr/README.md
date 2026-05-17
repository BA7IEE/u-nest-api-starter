# ADR — Architecture Decision Records

本目录承载**派生项目** B 类能力解锁的设计决策记录(Architecture Decision Records)。

---

## 1. 这个目录是给谁的

- **模板仓库自身**(当前仓库,`package.json#name === u-nest-api-starter`)处于 **template-freeze 模式**(见 [`README.md`](../../README.md) 顶部声明),**不在模板内新增业务 ADR**。本目录在模板里只放骨架文件:`README.md`(本文)+ `000-template.md`(ADR 模板)。
- **派生项目**(`u-rescue-api` / `u-studio-internal-api` / `u-mp-<biz>-api` / 客户项目二开)使用本目录承载所有 B 类能力解锁的 ADR。派生后立即可用,无需新建目录。

## 2. 什么时候必须写 ADR

派生项目在以下情况**必须先有 Accepted 状态的 ADR**,才能动代码:

- 触碰 [`docs/capability-unlock-matrix.md`](../capability-unlock-matrix.md) §B 任一条目(11 项 B 类能力)
- 修改 `ARCHITECTURE.md` / `CLAUDE.md` / `AGENTS.md` 继承段落(见 [`docs/derived-project-governance.md`](../derived-project-governance.md) §7.2)

C 类(派生项目正常业务)不需要 ADR。详见 [`docs/derived-project-governance.md`](../derived-project-governance.md) §3 / §4。

## 3. 文件命名

```
docs/adr/NNN-<topic>.md
```

- `NNN` 从 `001` 起编号,与已有 ADR 顺延(`000-template.md` 占位,不计入正式编号)
- `<topic>` 用小写中横线,例如:
  - `001-rbac-with-permission-table.md`
  - `002-orgs-tree.md`
  - `003-refresh-token-tokenversion.md`

## 4. 写 ADR 的最小流程

1. 复制 [`000-template.md`](./000-template.md) 为 `NNN-<topic>.md`
2. 按模板填写 8 节(背景 → 涉及规则 → 候选方案 → 决策 → 影响范围 → 不变式声明 → 升级路径 → 是否回流模板)
3. 状态依次为 `Proposed` → `Accepted` → 实施完成后保持 `Accepted`
4. 实施代码与 ADR 在**同一 PR** 中(便于 review 对齐)
5. 同步更新:
   - [`docs/capability-unlock-matrix.md`](../capability-unlock-matrix.md) 对应行的"当前派生项目状态"列从 🔒 改为 ✅ + ADR 编号
   - 派生项目 `CHANGELOG.md`
   - 其它"解锁后必须同步更新"项,见 [`docs/derived-project-governance.md`](../derived-project-governance.md) §6

## 5. ADR 不删原则

- 即使最终状态为 `Rejected`,**不删 ADR 文件**——保留决策历史,未来再有人提出相同诉求时能直接查到"上次为什么不做"
- `Superseded by ADR-XXX` 状态保留原文,在顶部加引用,见 [`docs/derived-project-governance.md`](../derived-project-governance.md) §10 FAQ Q5

## 6. 与治理总则的关系

本目录是 [`docs/derived-project-governance.md`](../derived-project-governance.md) §5 流程的**产物落地位置**。如本文与治理总则表述冲突,以治理总则为准。
