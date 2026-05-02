import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// 分页入参铁律(ARCHITECTURE.md §7.3):
// - 字段固定 page / pageSize,默认 page=1 / pageSize=20,pageSize 上限 100
// - 禁止 limit/offset / skip/take / cursor 等变体
// - Prisma 查询时换算 skip = (page - 1) * pageSize,take = pageSize
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}

// 分页出参铁律:items / total / page / pageSize 固定,不允许 list/count/rows 变体。
// 默认排序 orderBy: { createdAt: 'desc' }(由各 service 实现保证)。
export class PageResultDto<T> {
  items!: T[];
  total!: number;
  page!: number;
  pageSize!: number;
}
