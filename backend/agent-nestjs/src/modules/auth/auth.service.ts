import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as Argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { User } from '@prisma/client';
import { TCurrentUser } from '@/common/decorators/CurrentUser';
import { ToApiUserRole } from '@/common/utils/RoleMapper';
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service';
import { RedisService } from '@/modules/redis/redis.service';
import { SessionsService } from '@/modules/sessions/sessions.service';
import { SystemSettingsService } from '@/modules/system-settings/system-settings.service';
import { UsersService } from '@/modules/users/users.service';
import { REFRESH_TOKEN_HEADER } from './constants/Auth';
import { AuthTokensResponseDto } from './dto/auth-tokens-response.dto';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type TRequestMeta = {
  userAgent: string | null;
  clientIp: string | null;
  deviceName?: string;
  deviceType?: string;
};

type TRefreshTokenPayload = {
  sub: string;
  sessionId: string;
  role: string;
  tokenVersion: number;
  type: 'refresh';
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<TGlobalEnv>,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly redisService: RedisService,
    private readonly auditLogsService: AuditLogsService,
    private readonly systemSettingsService: SystemSettingsService,
  ) {}

  public async HashPassword(password: string): Promise<string> {
    const pepper = this.configService.get('PASSWORD_PEPPER') ?? '';
    return Argon2.hash(`${password}${pepper}`);
  }

  public VerifyPassword(password: string, hash: string): Promise<boolean> {
    const pepper = this.configService.get('PASSWORD_PEPPER') ?? '';
    return Argon2.verify(hash, `${password}${pepper}`);
  }

  public BuildAuthUser(user: User): AuthUserResponseDto {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName ?? null,
      phone: user.phone,
      role: ToApiUserRole(user.role),
      status: user.status,
    };
  }

  public async Register(body: RegisterDto, requestMeta: TRequestMeta): Promise<AuthTokensResponseDto> {
    if ((this.configService.get('AUTH_REGISTER_REQUIRE_PHONE') ?? 'false') === 'true' && !body.phone) {
      throw new BadRequestException('Phone is required');
    }

    const existingByUsername = await this.usersService.FindByUsername(body.username);
    if (existingByUsername) {
      throw new ConflictException('Username already exists');
    }

    if (body.phone) {
      const existingByPhone = await this.usersService.FindByPhone(body.phone);
      if (existingByPhone) {
        throw new ConflictException('Phone already exists');
      }
    }

    const passwordHash = await this.HashPassword(body.password);
    const user = await this.usersService.Create({
      username: body.username,
      displayName: body.displayName ?? null,
      phone: body.phone ?? null,
      passwordHash,
    });

    await this.auditLogsService.Create({
      action: 'auth.register',
      user: { connect: { id: user.id } },
    });

    return this.IssueLoginSession(user, requestMeta);
  }

  public async RegisterPublic(body: RegisterDto, requestMeta: TRequestMeta): Promise<AuthTokensResponseDto> {
    const isEnabled = await this.systemSettingsService.IsPublicUserRegisterEnabled();
    if (!isEnabled) {
      throw new ForbiddenException('Register is disabled');
    }

    return this.Register(body, requestMeta);
  }

  public async Login(body: LoginDto, requestMeta: TRequestMeta): Promise<AuthTokensResponseDto> {
    const normalizedAccount = this.NormalizeAccount(body.account);
    const frozenUntil = await this.GetAccountFrozenUntil(normalizedAccount);
    if (frozenUntil) {
      throw new ForbiddenException(this.BuildLoginFrozenMessage(frozenUntil));
    }

    const user = await this.usersService.FindByAccount(body.account);
    if (!user) {
      const nextFrozenUntil = await this.HandleLoginFailed(normalizedAccount);
      if (nextFrozenUntil) {
        throw new ForbiddenException(this.BuildLoginFrozenMessage(nextFrozenUntil));
      }

      throw new UnauthorizedException('\u8d26\u53f7\u6216\u5bc6\u7801\u9519\u8bef');
    }

    const passwordValid = await this.VerifyPassword(body.password, user.passwordHash);
    if (!passwordValid) {
      const nextFrozenUntil = await this.HandleLoginFailed(normalizedAccount);
      await this.auditLogsService.Create({
        action: 'auth.login.failed',
        user: { connect: { id: user.id } },
        metadata: { account: body.account },
      });

      if (nextFrozenUntil) {
        throw new ForbiddenException(this.BuildLoginFrozenMessage(nextFrozenUntil));
      }

      throw new UnauthorizedException('\u5bc6\u7801\u9519\u8bef');
    }

    if (user.status !== 'active') {
      throw new ForbiddenException('\u8be5\u8d26\u53f7\u5df2\u88ab\u7981\u7528');
    }

    await this.ClearLoginFailedState(normalizedAccount);

    return this.IssueLoginSession(user, {
      ...requestMeta,
      deviceName: body.deviceName,
      deviceType: body.deviceType,
    });
  }

  public async Refresh(refreshToken: string): Promise<AuthTokensResponseDto> {
    const refreshSecret = this.configService.get('JWT_REFRESH_SECRET') ?? '';
    const payload = await this.jwtService.verifyAsync<TRefreshTokenPayload>(refreshToken, {
      secret: refreshSecret,
    }).catch(() => null);

    if (!payload || payload.type !== 'refresh') {
      throw new UnauthorizedException(`Invalid ${REFRESH_TOKEN_HEADER}`);
    }

    const user = await this.usersService.FindById(payload.sub);
    const session = await this.sessionsService.FindBySessionId(payload.sessionId);
    if (!user || !session || session.isRevoked || user.status !== 'active') {
      throw new UnauthorizedException('Refresh session is invalid');
    }

    if (user.tokenVersion !== payload.tokenVersion || session.userId !== user.id) {
      throw new UnauthorizedException('Refresh session is expired');
    }

    const tokenValid = await Argon2.verify(session.refreshTokenHash, refreshToken);
    if (!tokenValid) {
      throw new UnauthorizedException('Refresh token mismatch');
    }

    const tokens = await this.SignTokens(user, session.sessionId as string);
    const refreshExpiresAt = this.BuildExpiryDate(this.configService.get('JWT_REFRESH_EXPIRES_IN') ?? '7d');
    const refreshTokenHash = await Argon2.hash(tokens.refreshToken);

    await this.sessionsService.UpdateRefreshToken(session.sessionId, refreshTokenHash, refreshExpiresAt);
    await this.redisService.SetKey(
      `auth:refresh:${session.sessionId}`,
      refreshTokenHash,
      this.GetTtlSeconds(refreshExpiresAt),
    );
    return tokens;
  }

  public async Logout(currentUser: TCurrentUser, sessionId?: string): Promise<{ status: string }> {
    const targetSessionId = sessionId ?? currentUser.sessionId;
    const session = await this.sessionsService.FindBySessionId(targetSessionId);
    if (!session || session.userId !== currentUser.userId) {
      throw new UnauthorizedException('Session not found');
    }

    await this.sessionsService.RevokeBySessionId(targetSessionId);
    await this.redisService.DeleteKey(`auth:refresh:${targetSessionId}`);
    await this.auditLogsService.Create({
      action: 'auth.logout',
      user: { connect: { id: currentUser.userId } },
      metadata: { sessionId: targetSessionId },
    });

    return { status: 'ok' };
  }

  public async LogoutAll(currentUser: TCurrentUser): Promise<{ status: string }> {
    const sessions = await this.sessionsService.FindByUserId(currentUser.userId);

    await this.sessionsService.RevokeAllByUserId(currentUser.userId);
    await this.usersService.IncrementTokenVersion(currentUser.userId);
    for (const session of sessions) {
      await this.redisService.DeleteKey(`auth:refresh:${session.sessionId}`);
    }

    await this.auditLogsService.Create({
      action: 'session.revoke_all',
      user: { connect: { id: currentUser.userId } },
    });

    return { status: 'ok' };
  }

  public async SignTokens(user: User, sessionId: string = randomUUID()): Promise<AuthTokensResponseDto> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      sessionId,
      role: user.role,
      tokenVersion: user.tokenVersion,
      type: 'access',
    });
    const refreshToken = await this.jwtService.signAsync({
      sub: user.id,
      sessionId,
      role: user.role,
      tokenVersion: user.tokenVersion,
      type: 'refresh',
    }, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    });

    return {
      accessToken,
      refreshToken,
      sessionId,
      user: this.BuildAuthUser(user),
    };
  }

  private async IssueLoginSession(user: User, requestMeta: TRequestMeta): Promise<AuthTokensResponseDto> {
    const sessions = await this.sessionsService.FindByUserId(user.id);

    await this.sessionsService.RevokeAllByUserId(user.id);
    for (const session of sessions) {
      await this.redisService.DeleteKey(`auth:refresh:${session.sessionId}`);
    }

    const nextUser = await this.usersService.IncrementTokenVersion(user.id);
    const tokens = await this.SignTokens(nextUser);
    const refreshTokenHash = await Argon2.hash(tokens.refreshToken);
    const refreshExpiresAt = this.BuildExpiryDate(this.configService.get('JWT_REFRESH_EXPIRES_IN') ?? '7d');

    await this.sessionsService.Create({
      sessionId: tokens.sessionId,
      refreshTokenHash,
      deviceType: requestMeta.deviceType ?? null,
      deviceName: requestMeta.deviceName ?? null,
      clientIp: requestMeta.clientIp,
      userAgent: requestMeta.userAgent,
      expiresAt: refreshExpiresAt,
      lastActiveAt: new Date(),
      user: { connect: { id: user.id } },
    });

    await this.redisService.SetKey(
      `auth:refresh:${tokens.sessionId}`,
      refreshTokenHash,
      this.GetTtlSeconds(refreshExpiresAt),
    );
    await this.usersService.UpdateLastLoginAt(user.id);
    await this.auditLogsService.Create({
      action: 'auth.login.success',
      user: { connect: { id: user.id } },
      metadata: { sessionId: tokens.sessionId },
    });

    return tokens;
  }

  private BuildExpiryDate(expiresIn: string): Date {
    const now = Date.now();
    const match = expiresIn.match(/^(\d+)([smhd])$/i);
    if (!match) {
      return new Date(now + 7 * 24 * 60 * 60 * 1000);
    }

    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    const unitMap: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(now + value * unitMap[unit]);
  }

  private GetTtlSeconds(expiresAt: Date): number {
    return Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  }

  private async HandleLoginFailed(account: string): Promise<Date | null> {
    const freezeSeconds = this.GetLoginFreezeSeconds();
    const failedCount = await this.redisService.IncrementKey(this.BuildLoginFailKey(account));

    if (failedCount === 1) {
      await this.redisService.ExpireKey(this.BuildLoginFailKey(account), freezeSeconds);
    }

    if (failedCount < this.GetLoginFailLimit()) {
      return null;
    }

    const frozenUntil = new Date(Date.now() + freezeSeconds * 1000);
    await this.redisService.SetKey(this.BuildLoginFreezeKey(account), frozenUntil.toISOString(), freezeSeconds);
    await this.redisService.DeleteKey(this.BuildLoginFailKey(account));
    return frozenUntil;
  }

  private async GetAccountFrozenUntil(account: string): Promise<Date | null> {
    const frozenUntil = await this.redisService.GetKey(this.BuildLoginFreezeKey(account));
    if (!frozenUntil) {
      return null;
    }

    return new Date(frozenUntil);
  }

  private async ClearLoginFailedState(account: string): Promise<void> {
    await this.redisService.DeleteKey(this.BuildLoginFailKey(account));
    await this.redisService.DeleteKey(this.BuildLoginFreezeKey(account));
  }

  private GetLoginFailLimit(): number {
    return Number(this.configService.get('AUTH_LOGIN_FAIL_LIMIT') ?? '10');
  }

  private GetLoginFreezeSeconds(): number {
    const freezeHours = Number(this.configService.get('AUTH_LOGIN_FREEZE_HOURS') ?? '24');
    return freezeHours * 60 * 60;
  }

  private NormalizeAccount(account: string): string {
    return account.trim().toLowerCase();
  }

  private BuildLoginFailKey(account: string): string {
    return `auth:login:fail:${account}`;
  }

  private BuildLoginFreezeKey(account: string): string {
    return `auth:login:freeze:${account}`;
  }

  private BuildLoginFrozenMessage(frozenUntil: Date): string {
    const year = frozenUntil.getFullYear();
    const month = String(frozenUntil.getMonth() + 1).padStart(2, '0');
    const day = String(frozenUntil.getDate()).padStart(2, '0');
    const hours = String(frozenUntil.getHours()).padStart(2, '0');
    const minutes = String(frozenUntil.getMinutes()).padStart(2, '0');
    return `该账号因频繁登录，被冻结，${year}-${month}-${day} ${hours}:${minutes}:00 恢复登录`;
  }
}
