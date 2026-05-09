import { Global, Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
