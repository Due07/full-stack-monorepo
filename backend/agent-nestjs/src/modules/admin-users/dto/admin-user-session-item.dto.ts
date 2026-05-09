import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminUserSessionItemDto {
  @ApiProperty({ description: '会话 ID' })
  public sessionId!: string;

  @ApiPropertyOptional({ nullable: true, description: '设备类型' })
  public deviceType!: string | null;

  @ApiPropertyOptional({ nullable: true, description: '设备名称' })
  public deviceName!: string | null;

  @ApiPropertyOptional({ nullable: true, description: '登录 IP' })
  public clientIp!: string | null;

  @ApiPropertyOptional({ nullable: true, description: '用户代理' })
  public userAgent!: string | null;

  @ApiPropertyOptional({ nullable: true, description: '最后活跃时间' })
  public lastActiveAt!: string | null;

  @ApiProperty({ description: '会话过期时间' })
  public expiresAt!: string;

  @ApiProperty({ description: '是否已失效' })
  public isRevoked!: boolean;
}
