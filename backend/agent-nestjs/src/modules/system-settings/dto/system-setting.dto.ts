import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class SystemSettingItemDto {
  @ApiProperty({ description: '配置键', example: 'public_user_register_enabled' })
  public key!: string;

  @ApiProperty({ description: '配置值，当前统一以字符串形式返回', example: 'false' })
  public value!: string;

  @ApiPropertyOptional({ description: '配置说明', example: '是否开启用户端 H5 注册入口' })
  public description?: string | null;

  @ApiProperty({ description: '更新时间', example: '2026-04-27T15:00:00.000Z' })
  public updatedAt!: string;
}

export class SystemSettingListDataDto {
  @ApiProperty({ type: [SystemSettingItemDto], description: '系统配置项列表' })
  public items!: SystemSettingItemDto[];
}

export class UpdateSystemSettingDto {
  @ApiProperty({ description: '配置值，布尔配置支持传 true / false', example: 'true' })
  @Transform(({ value }) => String(value))
  @IsString()
  @IsNotEmpty()
  public value!: string;
}
