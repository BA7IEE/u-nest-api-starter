import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { AppConfig } from './config/app.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // 触发 app.config.ts 内的启动强校验(registerAs callback 已在模块解析时执行,
  // 这里再显式 get 一次确保 fail-fast 错误清晰透出)。
  const configService = app.get(ConfigService);
  const appCfg = configService.get<AppConfig>('app');
  if (!appCfg) {
    throw new Error('app.config 未加载,无法启动');
  }

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

  await app.listen(appCfg.port);
}

void bootstrap();
