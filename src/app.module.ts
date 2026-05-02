import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import type { Request } from 'express';
import { LoggerModule } from 'nestjs-pino';
import type { Params } from 'nestjs-pino';
import type { CurrentUserPayload } from './common/decorators/current-user.decorator';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
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

// V1.1 §17.5 / TASKS.md 15.2:HTTP 自动日志只打 method / url / status / responseTime
// + requestId(pino 内置)+ userId(若已登录)。禁止默认打印请求体。
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
      customProps: (req) => {
        // pino-http 在响应阶段调用 customProps,此时若有认证已 attach req.user。
        // 未登录请求不打 userId,保持日志干净。
        const user = (req as Request & { user?: CurrentUserPayload }).user;
        return user ? { userId: user.id } : {};
      },
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
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
  ],
  providers: [
    // 顺序固定:JwtAuthGuard 先验登录,RolesGuard 再验角色(详见 ARCHITECTURE.md §7.6)。
    // 全局注册后,所有未标 @Public() 的接口默认要 JWT;@Roles 在已登录基础上再做角色过滤。
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
