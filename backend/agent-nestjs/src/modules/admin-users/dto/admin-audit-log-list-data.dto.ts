import { ApiProperty } from '@nestjs/swagger';
import { AdminAuditLogItemDto } from './admin-audit-log-item.dto';

export class AdminAuditLogListDataDto {
  @ApiProperty({ description: '总条数' })
  public total!: number;

  @ApiProperty({ description: '当前页码' })
  public page!: number;

  @ApiProperty({ description: '每页数量' })
  public pageSize!: number;

  @ApiProperty({ type: [AdminAuditLogItemDto], description: '审计日志列表' })
  public items!: AdminAuditLogItemDto[];
}
