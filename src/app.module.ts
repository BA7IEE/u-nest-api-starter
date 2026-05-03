import { randomBytes } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, type ThrottlerModuleOptions } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import type { Params } from 'nestjs-pino';
import type { CurrentUserPayload } from './common/decorators/current-user.decorator';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ThrottlerBizGuard } from './common/guards/throttler-biz.guard';
import appConfig from './config/app.config';
import type { AppConfig } from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';

// V1.1 §11.2 / §11.4 / TASKS.md 15.2:
// 敏感字段 redact 清单。命中字段日志输出 `[REDACTED]`,不能仅做长度截断。
// `*.<name>` 通配匹配任意嵌套对象的同名字段(纵深防御:即使将来日志格式变了也兜底)。
// 必须与 ARCHITECTURE.md §7.7 / §9 密码处理铁律对齐。
const LOG_REDACT_PATHS: readonly string[] = [
  // HTTP 头
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  // 请求 body 中的敏感字段(若将来配置打 body,这里兜底屏蔽)
  'req.body.password',
  'req.body.newPassword',
  'req.body.token',
  'req.body.accessToken',
  'req.body.refreshToken',
  // 通配:任意嵌套层级出现的同名字段(响应日志 / 自定义日志)
  '*.password',
  '*.newPassword',
  '*.passwordHash',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.secret',
];

// V1.1 §11.2 / TASKS.md 15.3:请求 ID 贯通(x-request-id)
// 客户端可在请求头传 `x-request-id` 透传调用链 ID;缺失或非法时由后端生成。
// 生成结果同时写回响应头与 pino 日志的 reqId 字段,前端报错时凭此对齐后端日志。
const REQUEST_ID_HEADER = 'x-request-id';

// 客户端透传的 x-request-id 必须做基本格式校验,挡住注入与超长字符串污染日志。
// 允许字符集刻意收窄为 `[A-Za-z0-9_\-.]`(避开冒号、引号、空格等可能破坏日志/响应头解析的字符);
// 长度 1-128:覆盖常见 UUID / cuid / 自定义 trace id 形态,又防止滥用。
// 校验失败 → 忽略客户端值,生成新 ID(等同未传场景)。
const REQUEST_ID_PATTERN = /^[A-Za-z0-9_\-.]{1,128}$/;

// cuid-like 风格:`c` 前缀 + 时间戳 base36 + 12 字节 crypto 随机 hex(24 字符)。
// 长度 ~33 字符,与项目 Prisma model 的 @default(cuid()) 同量级、易识别。
// 用 node:crypto.randomBytes 而非 Math.random / 自增计数器(CLAUDE.md §17.2 禁止),
// 也不引 uuid 包(任务卡 15.3 明确"无新依赖")。
function generateRequestId(): string {
  return `c${Date.now().toString(36)}${randomBytes(12).toString('hex')}`;
}

// pino-http 的 genReqId(req, res) 同时拿到 req 与 res,在中间件入口阶段调用,响应未发送,
// 因此可以在此 setHeader 写回 x-request-id,无需额外中间件。
// 返回值会被 pino-http 写入 `req.id`,后续日志条目自动带上 reqId 字段(默认字段名,见 pino-http logger.js)。
function genReqId(req: IncomingMessage, res: ServerResponse): string {
  const headerValue = req.headers[REQUEST_ID_HEADER];
  // Node http 的 headers 值类型为 string | string[] | undefined;数组场景取第一个。
  const candidate = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  const id = candidate && REQUEST_ID_PATTERN.test(candidate) ? candidate : generateRequestId();
  // 写回响应头:即使客户端没传,前端也能从响应头拿到本次请求的 ID。
  res.setHeader(REQUEST_ID_HEADER, id);
  return id;
}

// V1.1 TASKS.md 15.3:HTTP 请求日志 customProps 工厂。
// pino-http 在响应阶段调用此函数,把返回字段合并到当前请求日志条目**顶层**。
//   - reqId:与响应头 x-request-id 完全一致(同一字符串引用,均来自 genReqId → req.id)。
//     pino-http 默认仅把 ID 写在 req 子对象里(展现为 req.id),嵌套层级不利于运维 grep
//     与日志聚合按字段查询;这里再额外提到顶层,直接对齐 TASKS.md 15.3 "日志条目中可见
//     reqId 字段"。
//   - userId:已登录请求由 JwtStrategy.validate() 后 passport 挂在 Express Request 上;
//     未登录请求省略字段,避免无意义噪声。
// 导出供 test/e2e/request-id.e2e-spec.ts 做白盒断言:test 环境 LOG_LEVEL='silent'
// (buildLoggerModuleParams 强制),日志不输出,直接调用本函数等价于"customProps
// 真的返回了 reqId"——比启动一个非 silent 的 NestApplication + 重定向 destination
// 捕获 stdout 简单得多,也不需要触碰 test/setup/test-app.ts。
export function buildHttpLogProps(req: IncomingMessage): Record<string, unknown> {
  // req.id 是 pino-http 自身在 IncomingMessage 上的扩展(见 pino-http logger.js
  // `req.id = req.id || genReqId(req, res)`);Express Request 的 user 是 passport 扩展。
  // 两者都不在标准 Node/Express 类型上,这里集中做一次类型断言。
  const r = req as IncomingMessage & { id?: string; user?: CurrentUserPayload };
  const props: Record<string, unknown> = {};
  if (r.id) props.reqId = r.id;
  if (r.user) props.userId = r.user.id;
  return props;
}

// V1.1 §17.5 / TASKS.md 15.2:HTTP 自动日志只打 method / url / status / responseTime
// + reqId(pino 内置,见 genReqId 上方)+ userId(若已登录)。禁止默认打印请求体。
// req.user 在 JwtStrategy.validate() 后由 passport 挂载;响应阶段读取时已存在(若有认证)。
function buildLoggerModuleParams(appCfg: AppConfig): Params {
  // test 环境强制 silent:e2e 跑 137 用例,任何日志都会污染 jest 输出。
  // .env.test 不能修改(不在本任务允许的修改文件清单),只能在配置层面兜底。
  // 'silent' 不在 LOG_LEVEL 允许值清单里,这里是运行时实际 pino level,不是配置值。
  const isTest = appCfg.env === 'test';
  const isProd = appCfg.env === 'production';
  const level = isTest ? 'silent' : appCfg.logLevel;

  return {
    pinoHttp: {
      level,
      // V1.1 TASKS.md 15.3:接管 pino-http 默认 genReqId(默认是自增计数器 + 读 'request-id' 头,
      // CLAUDE.md §17.2 禁止"自增计数器")。本项目固定头名为 x-request-id,值缺失时生成 cuid-like ID。
      genReqId,
      // 非 production 且非 test 才开 pino-pretty(开发时才需要美化输出)。
      // production 直接 stdout JSON,机器可解析,容器编排环境收集日志最稳。
      transport:
        !isProd && !isTest
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: false,
                translateTime: 'SYS:HH:MM:ss.l',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
      redact: {
        paths: [...LOG_REDACT_PATHS],
        censor: '[REDACTED]',
        remove: false,
      },
      customProps: buildHttpLogProps,
      // 默认 pino-http 不打 req.body,显式不开启 serializer 以确保兜底。
    },
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
    }),
    // V1.1 §11.4:LoggerModule 全局注册,所有 HTTP 请求自动打日志;
    // useFactory 读取 app.config 决定 level / pretty / 是否 silent(test)。
    // 不为日志单建 logger.config.ts(违反 §11.4),全部参数推到 buildLoggerModuleParams。
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Params => {
        const appCfg = configService.get<AppConfig>('app');
        if (!appCfg) {
          throw new Error('app.config 未加载,LoggerModule 无法初始化');
        }
        return buildLoggerModuleParams(appCfg);
      },
    }),
    // V1.1 §11.4 / TASKS.md 15.7:登录接口限流。
    // 内存 storage(默认 ThrottlerStorageService),不引入 Redis。
    // 默认对所有路径生效,但 ThrottlerBizGuard.shouldSkip 默认 true,
    // 仅 @LoginThrottle() 标注的方法才走 limit/ttl 检查(等价于"反向白名单")。
    // setHeaders: false 完全关闭 X-RateLimit-* 与 Retry-After 头(任务卡 15.7
    // 明确"不暴露阈值数字、剩余配额、重置时间")。
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): ThrottlerModuleOptions => {
        const appCfg = configService.get<AppConfig>('app');
        if (!appCfg) {
          throw new Error('app.config 未加载,ThrottlerModule 无法初始化');
        }
        return {
          throttlers: [
            {
              name: 'default',
              limit: appCfg.loginThrottle.limit,
              // throttler ttl 单位是毫秒(见 throttler-storage-service.ts increment 调用)。
              // app.config 暴露秒数(运维更直观),这里换算 ms。
              ttl: appCfg.loginThrottle.ttlSeconds * 1000,
            },
          ],
          setHeaders: false,
        };
      },
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
  ],
  providers: [
    // 全局 Guard 顺序(NestJS 按 providers 数组顺序执行):
    //   ThrottlerBizGuard 先挡爆破(IP 维度,粗粒度),避免攻击流量打到 JWT 解析。
    //   JwtAuthGuard 验登录(@Public 跳过)。
    //   RolesGuard 验角色(详见 ARCHITECTURE.md §7.6)。
    // ThrottlerBizGuard 通过 shouldSkip 默认 true 实现"反向白名单":
    //   对未标 @LoginThrottle() 的方法直接放行,只有 POST /api/auth/login 走真限流。
    { provide: APP_GUARD, useClass: ThrottlerBizGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
