import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import type { AppConfig } from '../config/app.config';

// 应用全局启动配置(全局前缀 / CORS / ValidationPipe / 全局异常过滤器 / 全局响应拦截器)。
// main.ts 与 test 套件 (createTestApp) 共用此函数,保证测试与运行时行为 1:1 一致;
// 任何 main.ts 里的全局设定调整都必须改在这里,而不是在 main.ts 里手写一份新的。
//
// 不在此函数内做的事:
// - NestFactory.create:由调用方负责,便于测试替换 AppModule overrides
// - app.listen:测试不监听端口,直接用 supertest 走 app.getHttpServer()
// - Swagger 注册:仅 main.ts 在生产/开发链路注册,测试不需要
// - 配置强校验:由 ConfigService 加载 app.config.ts 时触发,无需在此重复
export function applyGlobalSetup(app: INestApplication, appCfg: AppConfig): void {
  app.setGlobalPrefix('/api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(appCfg.env === 'production'));
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.enableCors({ origin: appCfg.corsOrigin });
}
