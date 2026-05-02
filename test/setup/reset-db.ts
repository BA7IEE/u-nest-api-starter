import type { INestApplication } from '@nestjs/common';

// 14.2 阶段引入独立测试库(app_test + .env.test)后,
// 在此处通过 PrismaService 执行 TRUNCATE "User" RESTART IDENTITY CASCADE,
// 在每个 spec 文件的 beforeAll 调用,保证文件间互相隔离。
//
// 当前 14.1 阶段仅一条 health smoke,health 接口不读 DB,无需清表。
// 留此占位以确保 14.2 落地时文件路径/命名不再讨论。
export async function resetDb(_app: INestApplication): Promise<void> {
  // intentionally empty in 14.1; see file comment above.
}
