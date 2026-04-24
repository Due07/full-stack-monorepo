import { EnvConfigModule } from '@/common/ConfigModules';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
// import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    EnvConfigModule(),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule { }
