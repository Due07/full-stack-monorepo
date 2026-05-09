import { Body, Controller, Get, Headers, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonErrorResponses } from '@/common/swagger/SwaggerError';
import { ApiSuccessResponse } from '@/common/swagger/SwaggerResponse';
import type { Request } from 'express';
import { CurrentUser, TCurrentUser } from '@/common/decorators/CurrentUser';
import { UsersService } from '@/modules/users/users.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { REFRESH_TOKEN_HEADER } from './constants/Auth';
import { AuthTokensResponseDto } from './dto/auth-tokens-response.dto';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { OperationStatusDto } from './dto/operation-status.dto';

@ApiTags('认证-管理端')
@ApiCommonErrorResponses()
@Controller('admin/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: '管理端登录', description: '后台管理端登录接口，登录成功后会让旧会话失效。' })
  @ApiSuccessResponse(AuthTokensResponseDto, '登录成功')
  public Login(@Body() body: LoginDto, @Req() request: Request): Promise<AuthTokensResponseDto> {
    return this.authService.Login(body, {
      userAgent: request.headers['user-agent'] ?? null,
      clientIp: request.ip ?? null,
    });
  }

  @Post('refresh')
  @ApiOperation({ summary: '刷新令牌', description: '通过 refresh token 获取新的 access token 与 refresh token。' })
  @ApiHeader({ name: REFRESH_TOKEN_HEADER, required: false, description: '刷新令牌，优先通过请求头传递。' })
  @ApiSuccessResponse(AuthTokensResponseDto, '刷新成功')
  public Refresh(
    @Body() body: RefreshTokenDto,
    @Headers(REFRESH_TOKEN_HEADER) refreshTokenHeader?: string,
  ): Promise<AuthTokensResponseDto> {
    const refreshToken = refreshTokenHeader ?? body.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    return this.authService.Refresh(refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '退出登录', description: '退出当前会话；如果传入 sessionId，则退出指定会话。' })
  @UseGuards(JwtAuthGuard)
  @ApiSuccessResponse(OperationStatusDto, '退出结果')
  public Logout(
    @Body() body: LogoutDto,
    @CurrentUser() currentUser: TCurrentUser,
  ): Promise<OperationStatusDto> {
    return this.authService.Logout(currentUser, body.sessionId);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '当前用户', description: '根据 access token 获取当前后台登录用户信息。' })
  @UseGuards(JwtAuthGuard)
  @ApiSuccessResponse(AuthUserResponseDto, '当前登录用户信息')
  public async Me(@CurrentUser() currentUser: TCurrentUser): Promise<AuthUserResponseDto> {
    const user = await this.usersService.FindByIdOrThrow(currentUser.userId);
    return this.authService.BuildAuthUser(user);
  }
}
