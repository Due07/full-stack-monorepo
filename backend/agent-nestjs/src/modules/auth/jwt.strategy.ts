import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TCurrentUser } from '@/common/decorators/CurrentUser';
import { SessionsService } from '@/modules/sessions/sessions.service';
import { UsersService } from '@/modules/users/users.service';

type TJwtPayload = {
  sub: string;
  sessionId: string;
  role: string;
  tokenVersion: number;
  type: 'access' | 'refresh';
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService<TGlobalEnv>,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET') ?? '',
    });
  }

  public async validate(payload: TJwtPayload): Promise<TCurrentUser> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }

    const user = await this.usersService.FindById(payload.sub);
    if (!user || user.status !== 'active' || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('User session is invalid');
    }

    const session = await this.sessionsService.FindBySessionId(payload.sessionId);
    if (!session || session.userId !== user.id || session.isRevoked) {
      throw new UnauthorizedException('Session is invalid');
    }

    return {
      userId: user.id,
      sessionId: session.sessionId,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };
  }
}
