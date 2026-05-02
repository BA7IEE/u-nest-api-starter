import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { applyGlobalSetup } from '../../src/bootstrap/apply-global-setup';
import type { AppConfig } from '../../src/config/app.config';

// E2E 测试唯一的 NestApplication 工厂。
// 必须与 src/main.ts bootstrap() 的全局配置严格一致——双方共享 applyGlobalSetup,
// 任何全局 pipe / filter / interceptor / 前缀 / CORS 调整都改在那里。
//
// 不做的事(刻意省略):
// - 不调用 app.listen():supertest 直接通过 app.getHttpServer() 走内存 HTTP
// - 不注册 Swagger:E2E 不需要文档,且 Swagger 跳过逻辑由独立 spec 验证
// - 不注入 fixtures:每个 spec 自行造数据,保证隔离
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();

  const configService = app.get(ConfigService);
  const appCfg = configService.get<AppConfig>('app');
  if (!appCfg) {
    throw new Error('app.config 未加载,createTestApp 中止');
  }

  applyGlobalSetup(app, appCfg);

  await app.init();
  return app;
}
