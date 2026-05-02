import { registerAs } from '@nestjs/config';

const VALID_APP_ENVS = ['development', 'test', 'production'] as const;
export type AppEnv = (typeof VALID_APP_ENVS)[number];

function isAppEnv(value: string | undefined): value is AppEnv {
  return VALID_APP_ENVS.includes(value as AppEnv);
}

function parsePort(raw: string | undefined): number {
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`APP_PORT 无效:"${raw ?? ''}",必须是 1-65535 的整数`);
  }
  return port;
}

function parseCorsOrigin(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface AppConfig {
  env: AppEnv;
  port: number;
  corsOrigin: string[];
  swaggerEnabled: boolean;
}

export default registerAs('app', (): AppConfig => {
  const env = process.env.APP_ENV;
  if (!isAppEnv(env)) {
    throw new Error(`APP_ENV 无效:"${env ?? ''}",必须是 development | test | production`);
  }

  const port = parsePort(process.env.APP_PORT);
  const corsOrigin = parseCorsOrigin(process.env.APP_CORS_ORIGIN);

  if (env === 'production') {
    if (corsOrigin.length === 0) {
      throw new Error('生产环境 APP_CORS_ORIGIN 不能为空');
    }
    if (corsOrigin.includes('*')) {
      throw new Error('生产环境 APP_CORS_ORIGIN 禁止使用 *,必须显式列出前端域名');
    }
  }

  // ENABLE_SWAGGER 必须严格字符串判断 === 'true'
  // 禁止 Boolean(process.env.ENABLE_SWAGGER) 等 truthy 判断,否则字符串 'false' 会被误判为开启
  const swaggerEnabled = env !== 'production' || process.env.ENABLE_SWAGGER === 'true';

  return { env, port, corsOrigin, swaggerEnabled };
});
