import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UnfreezeLoginAccountDto {
  @ApiProperty({ description: '需要解封的登录账号，可传 username 或 phone' })
  @IsString()
  @MaxLength(64)
  public account!: string;

  @ApiPropertyOptional({ description: '解封原因，可选' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  public reason?: string;
}
