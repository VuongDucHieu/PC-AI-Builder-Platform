import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createObserveModule } from '@nestjs/observe';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { envSchema } from './config/env.schema.js';
import { HealthModule } from './health/health.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, unknown>) => {
        return envSchema.parse(config)
      }
    }),

    //Các NestJS module mà module hiện tại cần sử dụng
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'backend',
    }),

    HealthModule,
  ],

  //Các class xử lý HTTP route
  controllers: [AppController],

  //Các dependency được NestJS quản lý qua DI container
  providers: [AppService],
})
export class AppModule {}
