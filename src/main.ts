import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { applyGlobalSetup } from './bootstrap/apply-global-setup';
import { applySwagger } from './bootstrap/apply-swagger';
import type { AppConfig } from './config/app.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // 触发 app.config.ts 内的启动强校验(registerAs callback 已在模块解析时执行,
  // 这里再显式 get 一次确保 fail-fast 错误清晰透出)。
  const configService = app.get(ConfigService);
  const appCfg = configService.get<AppConfig>('app');
  if (!appCfg) {
    throw new Error('app.config 未加载,无法启动');
  }

  // 全局前缀 / CORS / ValidationPipe / 全局异常过滤器 / 全局响应拦截器 统一在 applyGlobalSetup 内,
  // main.ts 与 test/setup/test-app.ts 共用,避免双份配置漂移。详见 src/bootstrap/apply-global-setup.ts。
  applyGlobalSetup(app, appCfg);

  // Swagger 注册同样抽到 bootstrap/,main.ts 与 test 共用,避免漂移。
  // 内部判断 appCfg.swaggerEnabled(开发/test 默认开启,production 仅在 ENABLE_SWAGGER='true' 时开启)。
  applySwagger(app, appCfg);

  await app.listen(appCfg.port);
}

void bootstrap();
