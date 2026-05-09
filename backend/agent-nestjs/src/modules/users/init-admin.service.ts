import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Argon2 from 'argon2';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';

@Injectable()
export class InitAdminService implements OnApplicationBootstrap {
  private readonly logger = new Logger(InitAdminService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService<TGlobalEnv>,
  ) {}

  public async onApplicationBootstrap(): Promise<void> {
    const username = this.configService.get('INIT_ADMIN_USERNAME') ?? 'Admin';
    const password = this.configService.get('INIT_ADMIN_PASSWORD') ?? 'Aa123456';
    const existingUser = await this.usersService.FindByUsername(username);

    if (existingUser) {
      return;
    }

    const pepper = this.configService.get('PASSWORD_PEPPER') ?? '';
    const passwordHash = await Argon2.hash(`${password}${pepper}`);

    await this.usersService.Create({
      username,
      displayName: username,
      passwordHash,
      role: UserRole.super_admin,
      phone: null,
    });

    this.logger.log(`Initialized default super admin: ${username}`);
  }
}
