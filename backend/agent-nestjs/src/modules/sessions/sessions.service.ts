import { Injectable } from '@nestjs/common';
import { Prisma, UserSession } from '@prisma/client';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private readonly prismaService: PrismaService) {}

  public FindBySessionId(sessionId: string): Promise<UserSession | null> {
    return this.prismaService.userSession.findUnique({ where: { sessionId } });
  }

  public FindByUserId(userId: string): Promise<UserSession[]> {
    return this.prismaService.userSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public Create(data: Prisma.UserSessionCreateInput): Promise<UserSession> {
    return this.prismaService.userSession.create({ data });
  }

  public UpdateRefreshToken(sessionId: string, refreshTokenHash: string, expiresAt: Date): Promise<UserSession> {
    return this.prismaService.userSession.update({
      where: { sessionId },
      data: {
        refreshTokenHash,
        expiresAt,
        isRevoked: false,
      },
    });
  }

  public RevokeBySessionId(sessionId: string): Promise<UserSession> {
    return this.prismaService.userSession.update({
      where: { sessionId },
      data: { isRevoked: true },
    });
  }

  public RevokeAllByUserId(userId: string) {
    return this.prismaService.userSession.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  public TouchLastActiveAt(sessionId: string): Promise<UserSession> {
    return this.prismaService.userSession.update({
      where: { sessionId },
      data: { lastActiveAt: new Date() },
    });
  }
}
