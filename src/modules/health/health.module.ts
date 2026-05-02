import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

// health 是 4 文件铁律的明确例外(CLAUDE.md §2):
// 只有 module + controller,不创建 service / dto。
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
