import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonErrorResponses } from '@/common/swagger/SwaggerError';
import { ApiSuccessResponse } from '@/common/swagger/SwaggerResponse';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthTokensResponseDto } from './dto/auth-tokens-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('认证-v1')
@ApiCommonErrorResponses()
@Controller('v1/auth')
export class AuthV1Controller {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: '用户端注册', description: '面向用户 H5 的 v1 注册接口。注册逻辑沿用当前认证服务。' })
  @ApiSuccessResponse(AuthTokensResponseDto, '注册并登录成功')
  public Register(@Body() body: RegisterDto, @Req() request: Request): Promise<AuthTokensResponseDto> {
    return this.authService.RegisterPublic(body, {
      userAgent: request.headers['user-agent'] ?? null,
      clientIp: request.ip ?? null,
    });
  }

  @Post('login')
  @ApiOperation({ summary: '用户端登录', description: '面向用户 H5 的 v1 登录接口。登录逻辑沿用当前认证服务。' })
  @ApiSuccessResponse(AuthTokensResponseDto, '登录成功')
  public Login(@Body() body: LoginDto, @Req() request: Request): Promise<AuthTokensResponseDto> {
    return this.authService.Login(body, {
      userAgent: request.headers['user-agent'] ?? null,
      clientIp: request.ip ?? null,
    });
  }
}
