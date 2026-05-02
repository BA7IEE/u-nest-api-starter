import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { applyGlobalSetup } from './bootstrap/apply-global-setup';
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

  // Swagger 开关:开发/test 默认开启,production 仅在 ENABLE_SWAGGER='true' 时开启。
  // swaggerEnabled 已在 app.config.ts 计算好(详见 §8 + §14)。
  //
  // 路径锚定:文档(ARCHITECTURE.md §6 / CLAUDE.md §4)固定 /api/docs。
  // @nestjs/swagger 11 默认 setup() 不自动跟全局前缀,必须显式传
  // useGlobalPrefix: true,让 SwaggerModule 在 setGlobalPrefix('/api') 下
  // 注册到 /api/docs(及 /api/docs-json、/api/docs-yaml)。
  //
  // /api/docs* 由 ResponseInterceptor SKIP_PREFIXES 跳过包装,SwaggerModule
  // 直接返回原始 HTML / JSON / YAML(实际上 SwaggerModule 走 express
  // middleware 直接 send,本身也不会被 interceptor 命中,跳过列表是双保险)。
  if (appCfg.swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('U Nest API Starter')
      .setDescription('AI-friendly TypeScript API base — NestJS + Prisma + PostgreSQL')
      .setVersion('0.0.1')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      useGlobalPrefix: true,
    });
  }

  await app.listen(appCfg.port);
}

void bootstrap();
