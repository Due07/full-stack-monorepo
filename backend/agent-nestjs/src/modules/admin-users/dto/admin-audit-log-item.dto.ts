import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminAuditLogItemDto {
  @ApiProperty({ description: '日志 ID' })
  public id!: string;

  @ApiProperty({ description: '动作类型' })
  public action!: string;

  @ApiPropertyOptional({ nullable: true, description: '目标用户 ID' })
  public userId!: string | null;

  @ApiPropertyOptional({ nullable: true, description: '目标用户名' })
  public username!: string | null;

  @ApiPropertyOptional({ nullable: true, description: '操作人用户 ID' })
  public operatorUserId!: string | null;

  @ApiPropertyOptional({ nullable: true, description: '操作人用户名' })
  public operatorUsername!: string | null;

  @ApiPropertyOptional({ nullable: true, description: '扩展元数据' })
  public metadata!: unknown;

  @ApiProperty({ description: '创建时间' })
  public createdAt!: string;
}
