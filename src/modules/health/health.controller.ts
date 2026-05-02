import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

// v1 health 检查只返回 { status: 'ok' },不检查 DB / Redis 等外部依赖。
// 此响应仍走 ResponseInterceptor 包装,最终响应:
//   { code: 0, message: 'ok', data: { status: 'ok' } } + HTTP 200
// 详见 ARCHITECTURE.md §6 + CLAUDE.md §4。
//
// health 是 4 文件铁律的明确例外(无 service / dto),
// Swagger 响应 schema 用 inline 描述,不为此新建 HealthResponseDto。
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: '服务健康检查' })
  @ApiOkResponse({
    description: '服务正常',
    schema: {
      type: 'object',
      required: ['code', 'message', 'data'],
      properties: {
        code: { type: 'integer', example: 0 },
        message: { type: 'string', example: 'ok' },
        data: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['ok'], example: 'ok' },
          },
        },
      },
    },
  })
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
