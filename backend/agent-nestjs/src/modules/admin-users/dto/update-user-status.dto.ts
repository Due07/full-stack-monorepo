import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({ enum: ['active', 'disabled'], description: '目标状态：active 启用，disabled 禁用' })
  @IsString()
  @IsIn(['active', 'disabled'])
  public status!: 'active' | 'disabled';

  @ApiPropertyOptional({ description: '状态变更原因，可选' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  public reason?: string;
}
