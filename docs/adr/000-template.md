# ADR-NNN: <一句话标题>

> 本文件是**模板占位**,派生项目复制为 `NNN-<topic>.md` 后填写。
> 模板说明见 [`README.md`](./README.md);治理流程见 [`docs/derived-project-governance.md`](../derived-project-governance.md) §5。

- 状态:Proposed | Accepted | Superseded by ADR-XXX | Rejected
- 立项日期:YYYY-MM-DD
- 决策者:<姓名 / 角色>

---

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

- **Prisma schema**:<是否新增表 / 字段;给出 schema 草案>
- **migration**:<会生成几个 migration;是否有数据回填>
- **BizCode**:<新增哪些 BizCode,段位如何分配>
- **API**:<新增 / 修改哪些接口路径与 HTTP 方法>
- **DTO**:<新增 / 修改哪些 DTO>
- **测试**:<新增哪些 E2E spec / 单测>
- **OpenAPI contract**:<是否触发 snapshot 漂移,需要 `pnpm test:contract -u`>
- **文档**:<需要同步更新哪些 docs/*.md>

## 6. 不变式声明

<本 ADR 实施后,仍然保留的 A 类铁律(参见 [`docs/capability-unlock-matrix.md`](../capability-unlock-matrix.md) §A)。例如:>

- 响应格式仍是 `{ code, message, data }`
- 最后一个活跃 SUPER_ADMIN 保护未变
- `passwordHash` 仍不出响应
- DTO 字段白名单仍生效

## 7. 升级路径(向后)

<这个 ADR 如果未来要再升级,触发条件是什么?例如:>

- 当组织树超过 3 层 / 单个组织成员超过 1000 人时,考虑引入 Redis 缓存组织成员列表
- 当 RBAC 权限点超过 200 个时,考虑接 casl 替代手写 if

## 8. 是否回流模板?

<本 ADR 实现的能力是"通用工程能力"应回流模板?还是"业务模块"留在派生项目?>

- 业务模块(orgs / missions / devices ...)→ **不回流**
- 通用能力(common utility / 安全加固 / 测试工具)→ **可考虑回流**,按模板 v0.x.y release 走 PR review
- 文档规范遗漏 → 优先回流

参考 [`docs/derived-project-governance.md`](../derived-project-governance.md) §9。
