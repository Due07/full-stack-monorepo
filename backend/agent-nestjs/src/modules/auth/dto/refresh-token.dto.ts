import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({ description: 'refresh token 默认从 Header 读取' })
  @IsOptional()
  @IsString()
  public refreshToken?: string;
}
