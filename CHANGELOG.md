# Changelog

本仓库版本号在 `package.json#version` 与 Swagger `setVersion(...)` 同步维护;tag 由维护者按需打。

## Unreleased

### v2.0 Phase 0 — 文档宪法升级(RBAC + Auth baseline,2026-05-18)

> **本节是 v2.0 baseline 重置的 Phase 0 工作记录(docs-only PR)**。把 v1 历史阶段列为"不做"的 **RBAC + refresh token + logout** 升级为模板必备能力,并建立"永久红线 / v2.0 baseline 能力 / 派生项目 ADR 解锁能力"三档红线体系。**本 Phase 0 PR 不动 `src/**` / `prisma/**` / `package.json`,不创建 migration,不实现代码**;Phase 1 才落地 schema / migration / seed。

#### Added

- 新增 `docs/adr/ADR-001-v2-rbac-auth-baseline.md`:v2.0 baseline 重置决策记录。涵盖 11 节:背景与动机 / 涉及的模板规则 / 候选方案(A 保留 v1 / B baseline 重置 / C 只升 RBAC)/ 决策(采纳方案 B)/ Prisma schema 设计草案(5 张新表:`Role` / `Permission` / `UserRole` / `RolePermission` / `RefreshToken`)/ 权限码命名两段式严格 / 7 条 baseline 权限 / 3 个种子角色 / **五条 super_admin 铁律** / Guard + Decorator + JwtPayload 设计 / Auth baseline(refresh + logout + rotation)/ 接口契约变更 / 影响范围 / 不变式声明(扩展自永久红线 29 条)/ 升级路径(Phase 0-4 + 派生项目 v1→v2)/ 文档与代码协同 / **5 个补充修订点 A-E**(JWT payload 新增 `jti` / baseline 不建 refresh token family 模型 / logout 语义固定 / 创建用户 `roleCodes` 默认 `['user']` 防权限提升 / `@Public` 与 `@Permissions` 互斥测试约束)/ 验收门槛 / 状态变迁
- `ARCHITECTURE.md` 新增 §12 v2.0 baseline 升级(RBAC + Auth)章节:摘要 v2.0 一句话总结 / 红线分级三档 / baseline 必备能力清单 / Phase 0-4 实施阶段 / 派生项目 v1→v2 升级建议;并在目录加入 §12 入口
- `CLAUDE.md` 新增 §18 Claude Code v2.0 baseline 执行约束章节:阶段范围(当前 Phase 0 不允许动 `src` / `prisma`)/ baseline 必备能力清单 / baseline 不做的事(B 类 ADR 解锁)/ v2.0 禁止"顺手做"清单(10 条)/ 阶段验收门槛 / 边界声明
- `AGENTS.md` 新增 §18 通用 AI Agent v2.0 baseline 执行约束章节,与 `CLAUDE.md` §18 内容同步,差异仅在入口表述
- `docs/capability-unlock-matrix.md` 新增 B-12(部分通配权限 `user:*` / `*:read`)/ B-13(`@AnyPermission` OR 语义)/ B-14(数据级 / 行级权限)/ B-15(角色继承 / 部门范围权限)四条 v2.0 后细分权限解锁项;新增 B-1-archived 与 B-7-archived 两条退役标记
- `docs/capability-unlock-matrix.md` §2 状态标记新增 `🟢 baseline-covered`(v2.0 baseline 已覆盖,无需 ADR);§1 速读新增 `BL` 类标识(v2.0 baseline 已覆盖)
- 各文档顶部新增 v2.0 baseline 升级公告 block:`ARCHITECTURE.md` / `CLAUDE.md` / `AGENTS.md` / `docs/capability-unlock-matrix.md` 共 4 处

#### Changed

- `ARCHITECTURE.md` §1 设计原则末条:"不预先做 RBAC、多租户、刷新 token" 改为只保留"不预先做多租户",RBAC / 刷新 token 标注 "v2.0 baseline 已升级,见 ADR-001"
- `ARCHITECTURE.md` §4 v1 范围"不做"表:RBAC 行 / 刷新 token 行的"什么时候再加"列翻转为"v2.0 baseline 已升级";新增"部分通配权限 / `@AnyPermission` / 数据级权限 / 角色继承"汇总行(走 B-12/13/14/15 ADR);本人改密码 / 多租户 / 文件上传 / LLM 等其余条目维持不变(B-8 等 ADR 路径不变)
- `ARCHITECTURE.md` §5 数据模型 / §6 接口清单 / §7.11 角色层级 / §11 V1.1 章节顶部均新增 v2.0 baseline 升级提示 block,主体内容保留供 v1.x 维护分支参考;§7.11 重要声明改为"v1 历史声明,v2.0 已升级"
- `ARCHITECTURE.md` §8 环境变量:`JWT_EXPIRES_IN=7d` 标注为 v1 历史变量(deprecated in v2.0),新增 `JWT_ACCESS_EXPIRES_IN=15m` / `JWT_REFRESH_EXPIRES_IN=7d`(v2.0 baseline,Phase 1 才落 `.env.example`)
- `ARCHITECTURE.md` §9 升级路径表:删除"真要做权限点到按钮级" / "真有无感续期诉求"两行(v2.0 baseline 已覆盖);新增四行(部分通配权限 / OR 装饰器 / 数据级权限 / 角色继承)指向 B-12/13/14/15;表后新增"v2.0 baseline 已覆盖的能力"段落显式标注两条退役
- `CLAUDE.md` §1 v1 不做的事:整章按"红线三档"重构(`[A]` 永久红线 / `[BL]` v2.0 baseline 已升级 / `[B]` 派生项目 ADR 解锁 / `[C]` 派生项目正常业务 / `[D]` 表述过死);RBAC + refresh token 改为 `[BL]` 标签,本人改密码保留 `[B]`;新增 `[A]` 永久铁律 4 条(权限 code 不进字典 / 命名两段式 / refresh 哈希存储 / JwtPayload 不塞 roles/permissions);永久红线总数从 27 条标注为 29 条
- `CLAUDE.md` §8 权限与鉴权 / §13 角色层级与管理员保护 / §17 Claude Code V1.1 执行约束:顶部均新增 v2.0 baseline 升级提示 block;原文保留 + 末尾 `<!-- v1 历史声明,v2.0 已升级 -->` 注释
- `AGENTS.md` §1 / §8 / §13 / §17 同步 CLAUDE.md 修订(差异仅在入口表述与文件命名)
- `docs/capability-unlock-matrix.md` §B B-1 内容改造为"CASL / ability 表达式引擎"独立解锁条目;新增 B-1-archived 与 B-7-archived 两条退役标记说明 v2.0 baseline 已覆盖范围
- `docs/capability-unlock-matrix.md` §B B-7 内容改造为"refresh token 残余能力"(access token 主动吊销 / family / 异常重放全链路吊销 / 重置密码同步吊销该用户全部 refresh),主体 refresh + logout + rotation 改为 baseline 已覆盖
- `docs/capability-unlock-matrix.md` §A 永久红线清单从 27 条扩展为 **29 条**:第 11 条新增"refresh token 哈希存储";第 26 条新增"权限 code 不进字典";第 27 条新增"权限 code 命名两段式严格";第 3 / 7 / 8 / 9 条按 v2.0 语义升级(`JwtPayload 不塞 role` → `不塞 roles/permissions`;`RolesGuard` → `PermissionsGuard`;`@Roles(...)` → `@Permissions(...)`;最后一个 SUPER_ADMIN 保护 + 自我保护 → 五条 super_admin 铁律);新增"v1.x 维护分支的特殊处理"段落(v1.x 分支实际生效 26 条)
- `docs/capability-unlock-matrix.md` §3 派生项目状态全表:新增 RBAC / refresh token 两行标 🟢 baseline-covered (ADR-001);新增 B-12/13/14/15 四行;CASL 行从原"RBAC / permission"改造而来

#### Not changed(Phase 0 严格不动的范围)

- `src/**` 全部未触碰(无装饰器 / Guard / service / DTO / controller / 测试改动)
- `prisma/schema.prisma` 未触碰(无字段 / 表 / enum 变更)
- `prisma/migrations/**` 未触碰(无新增 migration)
- `prisma/seed.ts` 未触碰
- `package.json` / `pnpm-lock.yaml` 未触碰(无依赖变更)
- `.env.example` / `.env.test` 未触碰(`JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` 仅在文档示例中出现,Phase 1 才同步落 `.env.example`)
- `Dockerfile` / `docker-compose.yml` / `.github/workflows/**` 未触碰
- 14 个业务接口路径 / 方法 / 入参 / 出参 / 权限标注 / HTTP status / 错误码 / 响应体格式与 v0.1.7 完全一致
- OpenAPI 契约快照未变化(无 src 改动)
- 全量 19 spec / 162 用例 E2E 未触碰
- ADR-001 状态初始为 `Proposed`;合并 PR 时改 `Accepted` + 回填日期

#### v2.0 Phase 0 自检门槛

- `git diff --name-only` 中**无** `src/**` / `prisma/**` / `package.json` / `pnpm-lock.yaml` / `.github/**` 路径
- 工作目录 `prisma/migrations/` 无新增目录
- 全仓库 grep 不到"v2.0 不做 RBAC" / "v2.0 禁止 refresh" / "v2.0 禁止 logout" 之类残留表述(ADR-001 / CHANGELOG 内"v1 历史限制"类引用不计)
- ADR-001 状态保持 `Proposed`

#### v2.0 Phase 1+2+3 合并实施策略采纳(基于 Phase 0 后的可行性核查修订)

- **决策**:Phase 1 **不能单独 PR 合并 `main`**(删 `User.role` + 删 `Role` enum 会让 **18 个文件**的 `import { Role }` + **100+ 处**字面引用 + **9+ 处** `user.role` 字段访问同步 typecheck 红,CI required checks 100% 失败)。修订为 **Phase 1+2+3 合并到同一实现 PR,分 7 个逻辑 commit**;Phase 4 单独 PR。详见 [`docs/adr/ADR-001-v2-rbac-auth-baseline.md`](docs/adr/ADR-001-v2-rbac-auth-baseline.md) §7.1A
- **不采用替代方案**:双轨过渡 schema(违反 ADR-001 §4.1 "不留双轨")、临时手写 `Role` enum 占位(违反 v1 永久红线"枚举唯一来源是 Prisma schema")两个替代方案均明确拒绝
- **不调整 GitHub branch protection / required checks**:中间 commit(1-6)CI 红是合规预期,**只在 PR 最终 HEAD(commit 7)CI 全绿后合并**;不绕过 required check,不临时降级为 advisory
- **中间 commit 的语义**:仅作为 maintainer review 边界与派生项目升级参考序列,**绝对禁止**单独合并 / cherry-pick / revert 到 `main` 或其它发布分支
- **合并方式**:**优先 `merge commit`**(保 7 个 commit 边界供派生项目按图实施);若团队 git history 偏好线性必须 `squash`,release note 显式列 7 个子步骤;**不允许 `rebase merge`**
- **fixup commit 整理**:PR 期间允许 `fixup!` / `wip:` 自由 push;**合并前必须本地 `git rebase -i` 整理为 7 个逻辑 commit**(对应 ADR-001 §7.1A.3 表),force-push 触发最终 CI
- **分支与 release 时序**:① Phase 0(本 PR)合并 `main` + ADR-001 改 `Accepted` → ② **立即**在 `main` HEAD 打 `v1.x-maintenance` 分支 → ③ 从 `main` 开 `v2/rbac-auth-baseline` 实现分支 → ④ PR HEAD CI 全绿 + review 通过 → `merge commit` 进 `main` → ⑤ Phase 4 单独 PR 打 v2.0.0 tag
- 同步更新文档:`ARCHITECTURE.md` §12.4 / `CLAUDE.md` §18.1 / `AGENTS.md` §18.1 / ADR-001 §7.1 末尾均加入跨引用,指向 ADR-001 §7.1A 作为权威依据

#### v2.0 Phase 0 PR 最终收尾(2026-05-18)

- **ADR-001 状态从 `Proposed` 切换为 `Accepted`**;Accepted 日期回填为 2026-05-18(本 PR 收尾日);§11 状态变迁追加 Accepted 行,并标注"§7.1A Phase 1+2+3 合并实施策略已并入本 ADR"
- **Phase 0 验收门槛全部通过**:
  - `git diff --name-only` 仅 5 个 .md 文件 + 1 个新增 ADR,**无** `src/**` / `prisma/**` / `package.json` / `pnpm-lock.yaml` / `.github/**` 路径改动
  - `prisma/migrations/` 仍只有 `20260502100906_init`,**无**新增 migration 目录
  - 全仓库 grep "v2.0 不做 RBAC" / "v2.0 禁止 refresh" / "v2.0 禁止 logout" 仅命中显式否决性陈述(本 ADR / CHANGELOG / CLAUDE.md / AGENTS.md 自检条款),无实质性残留
  - ADR-001 在 `ARCHITECTURE.md` / `CLAUDE.md` / `AGENTS.md` / `docs/capability-unlock-matrix.md` / `CHANGELOG.md` 五个文档中均被引用至少一次
- **Phase 1 进入条件**:
  - 本 PR 合并 `main` 后,**立即**在 `main` HEAD 打 `v1.x-maintenance` 分支
  - 从 `main` 开 `v2/rbac-auth-baseline` 实现分支,按 ADR-001 §7.1A.3 表分 7 个 commit 推进(Phase 1+2+3 同一 PR)
  - **不调整 GitHub branch protection / required checks**;只在 PR HEAD CI 全绿后合并
  - Phase 4(CHANGELOG v2.0.0 release note + capability-matrix 状态全表 🟢 baseline-covered 行刷新 + 打 `v2.0.0` tag)单独 PR

## v0.1.7 - 2026-05-10

Template freeze 收口、派生指南成文、Docker Smoke 自动化进 CI、`README.md` baseline 字面量同步 bump 到 v0.1.7。所有改动严格落在 docs / CI / release 元数据(`package.json#version` + Swagger `setVersion`)路径,不动 14 个业务接口、Prisma schema、依赖版本。

### Added
- README.md 新增「派生指南」章节,说明从模板派生新项目(如 `u-rescue-api`)的标准流程:GitHub `Use this template` 创建新仓库 → 替换 `package.json` 三件套(`name` / `description` / `repository`) → 替换 Swagger 元数据(`src/bootstrap/apply-swagger.ts` 中 `setTitle` / `setDescription`) → 替换 `docker-compose.yml` 中 `container_name` 与默认数据库名 → 替换 `.env.example` 默认 `SUPER_ADMIN_USERNAME` → 重置 `CHANGELOG.md` 与 git tag 历史(可选) → 起新 PostgreSQL 容器 → `pnpm prisma:migrate` + `pnpm prisma:seed` → 按平铺方式在 `src/modules/<name>/` 下新增业务模块。同时列出派生项目**绝不要碰**的文件清单(`ARCHITECTURE.md` / `CLAUDE.md` / `AGENTS.md` 三件套铁律、`src/common/**` 基础件、`src/modules/{auth,users,health}/**` 规范实现示范、`prisma/migrations/**` 历史 migration),核心心智:派生即引用,模板铁律不修改
- 新增 `.github/workflows/docker-smoke.yml`,作为对 `docs/docker-smoke-test.md` §7 第二轮自动化的最小落地。独立于 `ci.yml`,触发范围限定 `Dockerfile` / `package.json` / `pnpm-lock.yaml` / `prisma/**` / 该 workflow 自身,只在 `pull_request` 触发,不绑 `push: main`。job 串行覆盖:`docker compose up -d postgres` → 创建独立 `app_smoke` DB → host 侧 `pnpm prisma:generate` / `pnpm prisma:deploy` / `pnpm prisma:seed`(跑两次验证幂等)→ `docker build` 生产镜像 → 以 `APP_ENV=production` + `ENABLE_SWAGGER=false` 启动 app 容器(加入 `u-nest-api-starter_default` 网络,host 端口 `13000` → 容器 `3000`)→ 轮询 `/api/health/live` ready → smoke 检查 `/api/health` `/api/health/live` `/api/health/ready` `/api/docs`(404)`/api/docs-json`(404)、登录正确凭据 / 用户不存在 / 错密码三场景(用户不存在与错密码响应体用 `jq -S | diff` 强制完全一致)、`/api/users/me` 无 token / 带 token(断言不含 `passwordHash`)→ `docker stop -t 10` 后断言 exit code = 0 验证 graceful shutdown。`JWT_SECRET` / `SUPER_ADMIN_PASSWORD` 由 step 内 `openssl rand` 临时生成 + `::add-mask::`,不进 GitHub Secrets。失败时统一 dump `docker ps -a` / app container logs / postgres logs 尾部 / `/tmp/smoke-*.json` 响应体;`if: always()` 清理 app container 与 docker compose。**non-required check**(不进 branch protection),失败不阻塞合并,只作早期告警

### Changed
- `.github/workflows/docker-smoke.yml` 的 `pull_request.paths` 在原 `Dockerfile` / `package.json` / `pnpm-lock.yaml` / `prisma/**` / 自身之外,先后两次扩展:(1) 增加 `docker-compose.yml`(Docker Smoke workflow 依赖其中的 Postgres service / `container_name: u-nest-api-postgres` / 网络名 `u-nest-api-starter_default`,原 paths 未覆盖会导致 `docker-compose.yml` 变更不触发 smoke);(2) 增加 production boot 敏感路径 `src/main.ts` / `src/app.module.ts` / `src/bootstrap/**` / `src/config/**` / `src/database/**`(Docker Smoke 依赖容器在 production 模式下的真实启动行为:config validation、global prefix、logger 初始化、Prisma graceful shutdown)。**不**纳入整个 `src/**`,业务模块改动仍走 `ci.yml` 的 e2e。该 workflow 仍是 non-required check

### Docs
- 模板 freeze 文档收口:`README.md` 顶部新增一行说明,声明 `Template baseline: v0.1.6`(本次随 v0.1.7 release 一并 bump 至 `Template baseline: v0.1.7`)、`main` 分支进入 template-freeze 模式(仅允许 docs / CI 触发路径变更),新业务模块应在派生项目(例如 `u-rescue-api`)中开发,不在本模板仓库继续堆叠。中英混排,方便 AI 与开源用户理解
- `docs/docker-smoke-test.md` 标题与开头说明改为 "v0.1.5 首轮手动报告(v0.1.6 已修复其中 logger WARN)",显式声明本文档定位为历史快照、v0.1.6 已修复 §6.1 的 WARN、当前自动化以 `.github/workflows/docker-smoke.yml` 为准并列出最新触发路径。smoke 结果本身一行未动
- `docs/deployment.md` 末尾新增 "Branch protection / required checks" 章节:列出建议的 required checks(`Lint / Typecheck / E2E`、`Docker image build`),说明 Docker Smoke 当前建议 non-required(容器启动级 smoke,受 runner / docker / network 时序影响更高,失败应人工查看而非默认阻塞所有 PR),并给出后续提升为 required 的触发条件(连续观察 ≥4 周无假阳性 / 进入正式生产部署前 / 引入显著放大启动差异的变更)
- `README.md` "常用命令"段补充 `pnpm test`(unit:不启动 Nest、不连数据库)与 `pnpm test:contract`(OpenAPI 契约快照,锁 14 接口 schema)两条护栏命令的简短说明,原"E2E 测试"段重命名为"测试(三档)",`pnpm test:e2e` 与 `pnpm db:test:init` / `pnpm db:test:reset` 的语义保持不变;补齐意图是避免新用户只跑 e2e 而忽略 unit / contract 两层快速反馈。仅 README 文案补充,无 API / Prisma schema / 依赖 / Dockerfile / docker-compose.yml / CI workflow / `src/**` 变更
- `docs/docker-smoke-test.md` §6.1 修正启动期 WARN(`[LegacyRouteConverter] Unsupported route path: "/api/*"`)的根因描述。v0.1.5 报告时初步判断与 Swagger 静态资源 / fallback route 有关,**该判断不准确**;v0.1.6 已定位真实根因为 `nestjs-pino` 的 `LoggerModule.configure()` 默认 `forRoutes: [{ path: '*', method: ALL }]` 与 `app.setGlobalPrefix('/api')` 拼接成 `/api/*`,触发 NestJS 11 + path-to-regexp v8 的 `LegacyRouteConverter`,因为 LoggerModule 注册两个 middleware 所以 WARN 重复一次。已在 `src/bootstrap/logger-options.ts` 中通过显式 `forRoutes: [{ path: '*path', method: RequestMethod.ALL }]` 修复。文档同步更新结论行(§9 摘要)标注"已在 v0.1.6 修复",并指明 v0.1.6 之后 smoke 复测应不再出现该 WARN。仅文档修正,smoke test 结果与判定不变,无 API / Prisma schema / 依赖 / Dockerfile / CI / src 变化
- README.md 顶部 freeze 声明字面量从 `Template baseline: v0.1.6` bump 到 `Template baseline: v0.1.7`(每次 release 元数据同步,与 `package.json#version` / Swagger `setVersion` 共生命周期)

### Not changed
- 14 个业务接口路径 / 方法 / 入参 / 出参 / 权限标注 / HTTP status / 错误码 / 响应体格式与 v0.1.6 完全一致
- `prisma/schema.prisma` 与已存在 migration 不变
- 依赖版本未变更,`pnpm-lock.yaml` 未变化
- `src/**` 仅 `src/bootstrap/apply-swagger.ts` 的 `setVersion()` 字面量从 `'0.1.6'` 改为 `'0.1.7'`,无业务逻辑 / 路由 / 中间件 / Guard / 拦截器 / DTO 变化
- `Dockerfile` / `docker-compose.yml` / `.github/workflows/ci.yml` / `.github/workflows/docker-smoke.yml`(workflow 本身)未动
- OpenAPI 契约快照 `paths` / `components.schemas` 段未变化(`info.version` 字段在 contract 测试中显式排除快照范围,因此 setVersion 字面量 bump 不会触发快照漂移)

## v0.1.6 - 2026-05-03

Docker smoke test documentation and startup warning cleanup.

### Added
- 新增 `docs/docker-smoke-test.md`,记录基于 v0.1.5 镜像 (HEAD `0826787`) 的第一轮手动 Docker smoke test:production 模式启动、独立 `app_smoke` DB、`prisma migrate deploy` + `prisma db seed`(幂等)、`/api/health` / `/api/health/live` / `/api/health/ready`、production 下 Swagger 关闭(404)、登录三场景统一错误码、`/api/users/me`、非 root + helmet + 优雅关闭 (exit 0) 全部验证通过。文档同时给出第二轮自动化进 CI 的最小方案建议(独立 `.github/workflows/docker-smoke.yml`,只在影响 Dockerfile / Prisma / lockfile 的 PR 触发,非 required check)

### Fixed
- 启动期消除 `[LegacyRouteConverter] Unsupported route path: "/api/*"` WARN(原本打两次)。根因:`nestjs-pino` 的 `LoggerModule.configure()` 默认 `forRoutes: [{ path: '*', method: ALL }]`,与 `app.setGlobalPrefix('/api')` 拼接后变成 `/api/*`,触发 NestJS 11 / path-to-regexp v8 的 legacy 路由自动转换并 warn(LoggerModule 注册 pino-http + bindLoggerMiddleware 两个 middleware,因此 warn 重复一次)。修复:在 `src/bootstrap/logger-options.ts` 显式声明 `forRoutes: [{ path: '*path', method: RequestMethod.ALL }]`,使用 path-to-regexp v8 命名 wildcard 跳过 legacy 转换路径,与 `LegacyRouteConverter` 错误信息推荐写法一致。语义不变,仍匹配全部以 `/api` 开头的请求;无 API / Prisma schema / 依赖 / Dockerfile / CI 变化

### Not changed
- 14 个业务接口路径 / 方法 / 入参 / 出参 / 权限标注 / HTTP status / 错误码 / 响应体格式与 v0.1.5 完全一致
- `prisma/schema.prisma` 与已存在 migration 不变
- 依赖版本未变更,`pnpm-lock.yaml` 未变化
- Dockerfile / `.github/workflows/ci.yml` / 其他 `src/**/*.ts` 未动

## v0.1.5 - 2026-05-03

V1.4 template maintenance — zero lint warnings, Prisma 7 upgrade evaluation, and prisma.config.ts migration.

V1.4-1 Lint 严格模式 — 不新增功能,不改 API / Prisma schema / 依赖版本;只把 `test/` 中遗留的 128 个 `@typescript-eslint/no-unsafe-argument` warning 收敛到 0,并在 `pnpm lint` 启用 `--max-warnings 0` 严格模式,封堵后续 lint 漂移。

### Added
- 新增 `test/helpers/http-server.ts`,提供 `httpServer(app: INestApplication): App` helper,把 `app.getHttpServer()` 的 `any` 返回值集中收敛为 supertest 的 `App` 类型;test 调用点统一改为 `request(httpServer(app))`,消除 125 处 `no-unsafe-argument` warning

### Changed
- `test/**/*.ts` 中所有 `request(app.getHttpServer())` 调用改为 `request(httpServer(app))`,涉及 19 个 e2e spec、`test/contract/openapi.contract-spec.ts`、`test/fixtures/auth.fixture.ts`、`test/helpers/call-endpoint.ts`
- `Object.keys(res.body.data)` 三处改为 `Object.keys(res.body.data as object)`(`users-me` / `users-admin-crud` / `users-admin-list`),在调用点显式收紧 supertest `Response.body: any` 的类型,消除 4 处 `no-unsafe-argument` warning
- `package.json#scripts.lint` 加上 `--max-warnings 0`,本地与 CI 共用同一入口;`.github/workflows/ci.yml` 的 `Lint` 步骤新增注释说明严格模式来源,避免未来误删 flag
- `docs/v1.3-plan.md` §6 标记 `[done — V1.4-1]`
- V1.4-2 Prisma 7 升级评估:新增 `docs/v1.4-prisma7-evaluation.md`,基于 Prisma 官方升级指南与本仓库源码 / Dockerfile / CI 触点,系统评估 Prisma 6.19.3 → 7.x 的影响面、风险矩阵、推荐升级步骤、回滚方案,以及拆分 PR 建议;结论:**当前不建议升级**(`prisma-client-js` → `prisma-client` generator 迁移会联动改写 Dockerfile §80-§150 的 prod 子集裁剪逻辑,投入产出比低,7.x 仍兼容 deprecated generator);唯一可考虑现在做的最小化收敛是 `package.json#prisma` → `prisma.config.ts` 迁移(独立任务,不在本评估内执行)。本任务**不升级依赖**、不改运行时代码、不动 Dockerfile / CI / Prisma schema
- V1.4-3 Prisma 配置迁移到 `prisma.config.ts`(对应评估文档 §6.1 / §7 PR A):新增 `prisma.config.ts`(`defineConfig({ migrations: { seed: 'tsx prisma/seed.ts' } })`),删除 `package.json#prisma` 配置块;为还原 Prisma CLI 检测到 `prisma.config.ts` 后**关闭**自动 `.env` 加载的副作用,在 config 顶部 `import 'dotenv/config'`(`dotenv` 已是 devDependency,无新增依赖,lockfile 无漂移)。仍在 Prisma 6.19.3,**不升级 prisma / @prisma/client**,**不改 schema.prisma**(datasource / generator 仍是 schema 内事实源),不改 Dockerfile / CI / 运行时代码。验证:`pnpm prisma:generate` / `prisma:deploy` / `prisma:seed`(含幂等)三命令均输出 `Loaded Prisma config from prisma.config.ts.` 并按预期完成

### Not changed
- 14 个业务接口路径 / 方法 / 入参 / 出参 / 权限标注 / HTTP status / 错误码 / 响应体格式与 v0.1.4 完全一致
- `prisma/schema.prisma` 与已存在 migration 不变
- 依赖版本未变更(未升级 Prisma 6 → 7,未引入新依赖)
- `pnpm-lock.yaml` 未变化(V1.4-3 使用的 `dotenv` 已是 devDependency)
- 业务模块未新增,RBAC / refresh token / 文件上传 Provider 仍未实现
- `eslint.config.mjs` 规则未调整(未对 `test/**/*.ts` 关闭 `no-unsafe-argument`,而是从源头补类型)
- Prisma Client generator 仍是 `prisma-client-js`(deprecated 但兼容,未迁到 `prisma-client`)
- Dockerfile / `.github/workflows/ci.yml` / `src/**/*.ts` / `prisma/seed.ts` 一行未动

## v0.1.4 - 2026-05-03

V1.3 Contract Hardening — 不新增业务功能,不修改 API 响应格式,不改 Prisma schema;只把"模板的契约面"(API schema、错误码 ↔ HTTP status、权限策略)从"E2E 顺带覆盖"升级为"独立断言 + 自动化 CI 护栏"。

V1.3 子任务一览:

- **V1.3-1** users.policy 单测矩阵(3×3 角色 × 4 函数 = 36 个判定点),`UsersService.findOne()` 拆出 `canViewUser` 语义
- **V1.3-2** BizCode 元属性单测断言(key 命名 / code 段位 / message / httpStatus 全量遍历)
- **V1.3-3** OpenAPI 快照测试(14 路由白名单 + 11 核心 DTO + `paths` / `components.schemas` 两段快照)
- **V1.3-4** 错误响应 Swagger schema 显式化(`ApiBizErrorResponse` 装饰器 + 14 路由错误码 schema 全量补全)
- **V1.3-5** CI 跑 unit + contract tests(`pnpm test` / `pnpm test:contract` 进 `Lint / Typecheck / E2E` job)

### Added
- V1.3-1 Contract Hardening:新增 `src/modules/users/users.policy.spec.ts`,以 `it.each` 表格化覆盖 `canViewUser` / `canManageUser` / `canCreateRole` / `canChangeRole` 的 3×3 角色矩阵(36 个判定点)
- 新增 `test/jest-unit.config.ts` 与 `pnpm test` 脚本(只跑 `src/**/*.spec.ts`,不启动 NestJS / 不连库),与 `pnpm test:e2e` 解耦
- `tsconfig.json` 排除 `src/**/*.spec.ts`,避免 spec 文件被 `nest build` 打入 `dist/`
- V1.3-2 Contract Hardening:新增 `src/common/exceptions/biz-code.constant.spec.ts`,`Object.entries(BizCode)` 遍历断言每个条目的 key(大写 SNAKE_CASE)、`code`(正整数 + 全局唯一 + 落在已分段范围内)、`message`(非空 string + 已 trim)、`httpStatus`(合法 `HttpStatus` 枚举值);避免新增 BizCode 漏掉基本约束
- V1.3-3 Contract Hardening:新增 `test/contract/openapi.contract-spec.ts` + Jest 原生快照,从 `/api/docs-json` 抓取 OpenAPI v3 文档并锁定:14 个业务接口 + 3 个健康检查 + auth/login 共 14 条路由的存在性、HTTP 方法集合与白名单一致(防漏增 / 漏删)、核心 11 个 DTO schema 仍存在、`paths` 与 `components.schemas` 两段快照保护字段级漂移
- 新增 `test/jest-contract.config.ts` 与 `pnpm test:contract` 脚本(复用 e2e 的 globalSetup,串行执行,与 `pnpm test:e2e` 解耦),首次快照已入 git;后续 schema 变更需显式 `pnpm test:contract -u` 在 PR diff 中 review
- V1.3-4 Contract Hardening:新增 `ApiBizErrorResponse(...bizCodes)` 装饰器(`src/common/decorators/api-response.decorator.ts`),按 `httpStatus` 自动分组、合并相同 status 下的多个业务码到一条 `@ApiResponse`,响应 schema 结构与 `AllExceptionsFilter` 真实输出 `{ code, message, data: null }` 一致,`code.enum` 列出全部可能业务码、`description` 列出每个 code 的语义
- 给所有 controller 方法补全错误响应 Swagger 装饰器:`auth/login`(400/401/429,替换原裸 `@ApiResponse`)、`health/ready`(500)、`users/me` 系列(401 / 400)、`users` 管理系列(覆盖 400/401/403/404/409 + `FORBIDDEN_ROLE_OPERATION`/`CANNOT_OPERATE_SELF`/`LAST_SUPER_ADMIN_PROTECTED`/`USER_NOT_FOUND`/`USERNAME_ALREADY_EXISTS`/`EMAIL_ALREADY_EXISTS` 等业务码)
- 同步刷新 `test/contract/__snapshots__/openapi.contract-spec.ts.snap`,新增的错误响应 schema 进入快照保护范围
- V1.3-5 Contract Hardening:`.github/workflows/ci.yml` 在 `Lint / Typecheck / E2E` job 内新增 `Run unit tests`(`pnpm test`)与 `Run contract tests`(`pnpm test:contract`)两步,顺序为 lint → typecheck → build → db setup → prisma:deploy → unit → contract → e2e。补全 V1.3-1(`users.policy.spec.ts`)/ V1.3-2(`biz-code.constant.spec.ts`)/ V1.3-3 + V1.3-4(OpenAPI 契约快照含错误响应 schema)在 CI 内的真实护栏覆盖

### Changed
- 同步项目版本号到 `0.1.4`(`package.json#version` + Swagger `setVersion('0.1.4')`)
- `UsersService.findOne()` 改为通过新增的 `assertCanViewUser` 走 `canViewUser` 策略;管理 / 删除 / 重置密码 / 改角色 / 改状态等"修改类"操作继续走 `canManageUser`。当前两者判定相同,仅区分语义,API 行为不变

### Not changed
- 14 个业务接口路径 / 方法 / 入参 / 出参 / 权限标注 / HTTP status / 错误码 / 响应体格式与 v0.1.3 完全一致
- `prisma/schema.prisma` 与已存在 migration 不变
- 业务模块未新增,RBAC / refresh token / 文件上传 Provider 仍未实现

## v0.1.3 - 2026-05-03

V1.2 模板收敛 — 不新增业务功能,不修改 API 响应格式,不做破坏性数据库变更;只提升长期可维护性、AI 二开稳定性和文档可读性。

### Changed
- 同步项目版本号到 `0.1.3`(`package.json#version`、Swagger `setVersion('0.1.3')`)
- 拆分 `src/app.module.ts`:logger / request-id / throttle 配置抽到 `src/bootstrap/`(`logger-options.ts` / `request-id.ts` / `throttle-options.ts`),`AppModule` 仅保留模块注册与全局 Guard 注册
- 新增 `src/modules/users/users.policy.ts`:集中 `canViewUser` / `canManageUser` / `canCreateRole` / `canChangeRole` 4 个纯函数;`UsersService` 不再散落角色判断,SUPER_ADMIN 结构性不变式(自我保护、最后一个 SUPER_ADMIN 保护)仍由 service 内事务保障
- 拆分 `README.md`:复杂内容迁移到 `docs/development.md` / `docs/testing.md` / `docs/deployment.md` / `docs/security.md`,`README.md` 仅保留项目定位、快速启动、路由总览、常用命令、文档入口
- `docs/security.md` 显式记录:当前版本支持软删除但不提供 restore 接口、误删恢复需 DBA 人工处理、未来 restore 接口契约预定义为 `PATCH /api/users/:id/restore`(仅 SUPER_ADMIN);token 吊销不实现 refresh token / Redis blacklist,仅记录未来 `tokenVersion` 升级路径
- 新增 `FINAL_REPORT.md`:本轮变更文件 / 原因 / 验收 / 遗留风险 / 建议 commit 命令
- 新增 `docs/v1.3-plan.md`:V1.3 Contract Hardening Plan(仅文档,不执行)

### Not changed
- API 响应格式、HTTP status、错误码、Swagger schema 与 v0.1.2 完全一致
- `prisma/schema.prisma` 与已存在 migration 不变
- 14 个业务接口路径 / 方法 / 入参 / 出参 / 权限标注与 v0.1.2 完全一致
- `.env.example` / `Dockerfile` / `.dockerignore` / `docker-compose.yml` / `.github/workflows/` 未触碰
- E2E 全量 19 spec / 162 用例继续通过(本机 ~15.6s)

## v0.1.2 - 2026-05-03

V1.1.1 工程收口修补 — 不引入新业务,不重构架构,只对 V1.1 之后暴露的版本一致性、生产迁移命令、CI 闭环、lint/typecheck 覆盖范围、README 残留表述做最小修补,并作为 patch release 正式发布。

### Fixed
- 同步项目版本号到 `0.1.2`(`package.json#version`、Swagger `setVersion('0.1.2')`),与本次 `v0.1.2` patch release 对齐
- 新增 `pnpm prisma:deploy` 脚本,作为生产数据库迁移固定入口(等价 `prisma migrate deploy`);保留 `pnpm prisma:migrate` 作为开发态入口
- CI 在 `typecheck` 之后、E2E 之前新增 `pnpm build` 步骤,显式验证 `tsconfig.build.json` 与 nest 构建产物链路
- CI 新增独立 `docker-build` job,验证多阶段 `Dockerfile` 在 CI 环境可成功构建出生产镜像(不做容器启动 / smoke test)
- CI 在数据库初始化之后、E2E 之前显式跑一次 `pnpm prisma:deploy`,验证生产迁移命令可执行(已迁移环境下为 no-op)
- `pnpm lint` 覆盖范围扩展为 `src/**/*.ts` + `test/**/*.ts` + `prisma/**/*.ts`
- `pnpm typecheck` 在原有 `tsconfig.json` 基础上追加 `test/tsconfig.test.json`,让测试代码也进入类型检查
- ESLint 显式 `project` 列表覆盖 `src` / `test` / `prisma` 三处源码;新增 `prisma/tsconfig.eslint.json` 仅供 ESLint 解析使用,不进入运行时构建链路;规则写入 `ARCHITECTURE.md` §11.7
- README 修正 V1.1 之后已不再准确的表述(Docker 用途、生产迁移策略、`prisma:deploy` 入口、runner 镜像不含 Prisma CLI 的说明)
- 新增 `CHANGELOG.md` 跟踪发布历史

## v0.1.1

- V1.1 engineering hardening
- Added GitHub Actions CI(lint / typecheck / E2E,基于 `docker compose` 启动 `postgres:16-alpine`)
- Added 多阶段 Dockerfile(`deps` → `builder` → `runner`,`node:22-alpine`,以非 root 用户运行)
- 接入结构化日志(`nestjs-pino`)与请求 ID(`x-request-id`,`cuid()` 兜底生成),敏感字段日志显示为 `[REDACTED]`
- 优雅关闭(`app.enableShutdownHooks()` + `PrismaService.onModuleDestroy()`)
- 健康检查分层(`/api/health` / `/api/health/live` / `/api/health/ready`,基于 `@nestjs/terminus`)
- helmet HTTP 安全头(Swagger UI 局部禁用 CSP)
- 登录接口限流(`@nestjs/throttler` 内存 storage,默认 IP 维度 5 次 / 60 秒)
- 扩展 E2E 覆盖(当前 19 spec / 162 用例)

## v0.1.0

- v1 基础闭环:NestJS + Prisma + PostgreSQL + Docker Compose + Swagger + JWT 登录 + 用户 CRUD + 简单角色权限 + 统一异常与返回格式
