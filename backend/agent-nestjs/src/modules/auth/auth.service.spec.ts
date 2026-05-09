import { BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service';
import { RedisService } from '@/modules/redis/redis.service';
import { SessionsService } from '@/modules/sessions/sessions.service';
import { SystemSettingsService } from '@/modules/system-settings/system-settings.service';
import { UsersService } from '@/modules/users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  const jwtServiceMock = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        PASSWORD_PEPPER: 'pepper',
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
        AUTH_REGISTER_REQUIRE_PHONE: 'false',
        AUTH_LOGIN_FAIL_LIMIT: '10',
        AUTH_LOGIN_FREEZE_HOURS: '24',
      };
      return values[key];
    }),
  };

  const usersServiceMock = {
    FindByUsername: jest.fn(),
    FindByPhone: jest.fn(),
    Create: jest.fn(),
    FindByAccount: jest.fn(),
    FindById: jest.fn(),
    IncrementTokenVersion: jest.fn(),
    UpdateLastLoginAt: jest.fn(),
  };

  const sessionsServiceMock = {
    FindByUserId: jest.fn(),
    RevokeAllByUserId: jest.fn(),
    Create: jest.fn(),
    FindBySessionId: jest.fn(),
    UpdateRefreshToken: jest.fn(),
    RevokeBySessionId: jest.fn(),
  };

  const redisServiceMock = {
    DeleteKey: jest.fn(),
    SetKey: jest.fn(),
    GetKey: jest.fn(),
    IncrementKey: jest.fn(),
    ExpireKey: jest.fn(),
  };

  const auditLogsServiceMock = {
    Create: jest.fn(),
  };

  const systemSettingsServiceMock = {
    IsPublicUserRegisterEnabled: jest.fn().mockResolvedValue(true),
  };

  const user = {
    id: 'user-1',
    username: 'zhangsan',
    phone: '13800138000',
    passwordHash: '',
    role: UserRole.user,
    status: UserStatus.active,
    tokenVersion: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    redisServiceMock.GetKey.mockResolvedValue(null);
    redisServiceMock.IncrementKey.mockResolvedValue(1);
    redisServiceMock.ExpireKey.mockResolvedValue(1);
    systemSettingsServiceMock.IsPublicUserRegisterEnabled.mockResolvedValue(true);
    authService = new AuthService(
      jwtServiceMock as unknown as JwtService,
      configServiceMock as never,
      usersServiceMock as unknown as UsersService,
      sessionsServiceMock as unknown as SessionsService,
      redisServiceMock as unknown as RedisService,
      auditLogsServiceMock as unknown as AuditLogsService,
      systemSettingsServiceMock as unknown as SystemSettingsService,
    );
  });

  it('should reject public register when setting is disabled', async () => {
    systemSettingsServiceMock.IsPublicUserRegisterEnabled.mockResolvedValue(false);

    await expect(authService.RegisterPublic({ username: 'zhangsan', password: 'Passw0rd1' }, {
      userAgent: null,
      clientIp: null,
    })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should reject duplicate username on register', async () => {
    usersServiceMock.FindByUsername.mockResolvedValue(user);

    await expect(authService.Register({ username: 'zhangsan', password: 'Passw0rd!' }, {
      userAgent: null,
      clientIp: null,
    })).rejects.toBeInstanceOf(ConflictException);
  });

  it('should require phone when register phone switch is enabled', async () => {
    configServiceMock.get.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        PASSWORD_PEPPER: 'pepper',
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
        AUTH_REGISTER_REQUIRE_PHONE: 'true',
      };
      return values[key];
    });

    await expect(authService.Register({ username: 'zhangsan', password: 'Passw0rd1' }, {
      userAgent: null,
      clientIp: null,
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should reject login when user is disabled', async () => {
    const disabledUser = { ...user, status: UserStatus.disabled, passwordHash: await authService.HashPassword('Passw0rd!') };
    usersServiceMock.FindByAccount.mockResolvedValue(disabledUser);

    await expect(authService.Login({ account: 'zhangsan', password: 'Passw0rd!' }, {
      userAgent: null,
      clientIp: null,
    })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should reject invalid refresh token', async () => {
    jwtServiceMock.verifyAsync.mockRejectedValue(new Error('bad token'));

    await expect(authService.Refresh('bad-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should freeze account after failed login reaches limit', async () => {
    configServiceMock.get.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        PASSWORD_PEPPER: 'pepper',
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
        AUTH_REGISTER_REQUIRE_PHONE: 'false',
        AUTH_LOGIN_FAIL_LIMIT: '1',
        AUTH_LOGIN_FREEZE_HOURS: '24',
      };
      return values[key];
    });
    usersServiceMock.FindByAccount.mockResolvedValue(null);
    redisServiceMock.IncrementKey.mockResolvedValue(1);

    await expect(authService.Login({ account: 'zhangsan', password: 'Passw0rd1' }, {
      userAgent: null,
      clientIp: null,
    })).rejects.toBeInstanceOf(ForbiddenException);
  });
});
