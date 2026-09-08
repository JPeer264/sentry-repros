import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { AppController } from './app.controller';

const providers = process.env.NO_FILTER ? [] : [{ provide: APP_FILTER, useClass: SentryGlobalFilter }];

@Module({
  imports: [SentryModule.forRoot()],
  controllers: [AppController],
  providers,
})
export class AppModule {}
