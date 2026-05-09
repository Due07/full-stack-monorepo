import { ApiProperty } from '@nestjs/swagger';

export class SessionItemDto {
  @ApiProperty({ description: '会话 ID' })
  public sessionId!: string;

  @ApiProperty({ required: false, nullable: true, description: '设备类型' })
  public deviceType!: string | null;

  @ApiProperty({ required: false, nullable: true, description: '设备名称' })
  public deviceName!: string | null;

  @ApiProperty({ required: false, nullable: true, description: '登录 IP' })
  public clientIp!: string | null;

  @ApiProperty({ required: false, nullable: true, description: '用户代理信息' })
  public userAgent!: string | null;

  @ApiProperty({ required: false, nullable: true, description: '最后活跃时间' })
  public lastActiveAt!: string | null;

  @ApiProperty({ description: '过期时间' })
  public expiresAt!: string;

  @ApiProperty({ description: '是否已失效' })
  public isRevoked!: boolean;
}
