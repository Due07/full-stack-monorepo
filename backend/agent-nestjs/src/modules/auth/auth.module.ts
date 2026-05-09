import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthV1Controller } from './auth-v1.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<TGlobalEnv>) => ({
        secret: configService.get('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRES_IN') ?? '24h',
        },
      }),
    }),
  ],
  controllers: [AuthController, AuthV1Controller],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
