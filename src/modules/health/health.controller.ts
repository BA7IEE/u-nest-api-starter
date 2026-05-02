import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';

// v1 health 检查只返回 { status: 'ok' },不检查 DB / Redis 等外部依赖。
// 此响应仍走 ResponseInterceptor 包装,最终响应:
//   { code: 0, message: 'ok', data: { status: 'ok' } } + HTTP 200
// 详见 ARCHITECTURE.md §6 + CLAUDE.md §4。
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
