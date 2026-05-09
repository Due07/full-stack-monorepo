import { ApiProperty } from '@nestjs/swagger';
import { AuthUserResponseDto } from './auth-user-response.dto';

export class AuthTokensResponseDto {
  @ApiProperty({ description: '访问令牌，用于访问受保护接口' })
  public accessToken!: string;

  @ApiProperty({ description: '刷新令牌，用于换取新的访问令牌' })
  public refreshToken!: string;

  @ApiProperty({ description: '当前登录会话 ID' })
  public sessionId!: string;

  @ApiProperty({ type: AuthUserResponseDto, description: '当前登录用户信息' })
  public user!: AuthUserResponseDto;
}
