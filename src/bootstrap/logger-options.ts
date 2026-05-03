import type { Params } from 'nestjs-pino';
import type { AppConfig } from '../config/app.config';
import { buildHttpLogProps, genReqId } from './request-id';

// V1.1 §11.2 / §11.4 / TASKS.md 15.2:
// 敏感字段 redact 清单。命中字段日志输出 `[REDACTED]`,不能仅做长度截断。
// `*.<name>` 通配匹配任意嵌套对象的同名字段(纵深防御:即使将来日志格式变了也兜底)。
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
// + reqId(pino 内置)+ userId(若已登录)。禁止默认打印请求体。
export function buildLoggerModuleParams(appCfg: AppConfig): Params {
  // test 环境强制 silent:e2e 跑 162 用例,任何日志都会污染 jest 输出。
  const isTest = appCfg.env === 'test';
  const isProd = appCfg.env === 'production';
  const level = isTest ? 'silent' : appCfg.logLevel;

  return {
    pinoHttp: {
      level,
      genReqId,
      // 非 production 且非 test 才开 pino-pretty(开发时才需要美化输出)。
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
    },
  };
}
