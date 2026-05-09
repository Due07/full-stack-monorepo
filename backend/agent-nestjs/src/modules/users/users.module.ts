import { Global, Module } from '@nestjs/common';
import { InitAdminService } from './init-admin.service';
import { UsersService } from './users.service';

@Global()
@Module({
  providers: [UsersService, InitAdminService],
  exports: [UsersService],
})
export class UsersModule {}
