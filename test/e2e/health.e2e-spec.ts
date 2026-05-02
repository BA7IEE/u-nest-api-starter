import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../setup/test-app';

// 14.1 阶段唯一的 smoke 测试,目的是验证 E2E 测试链路能跑通:
// - createTestApp() 与 main.ts 的全局配置一致(全局前缀 /api、ResponseInterceptor)
// - supertest 经 app.getHttpServer() 内存 HTTP 工作正常
// - health 走包装(在 SKIP_PREFIXES 之外),响应外层是 { code, message, data }
//
// 完整 health / response-format / swagger 等用例集见 14.3。
describe('GET /api/health (smoke)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 with wrapped { code: 0, message: "ok", data: { status: "ok" } }', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 0,
      message: 'ok',
      data: { status: 'ok' },
    });
  });
});
