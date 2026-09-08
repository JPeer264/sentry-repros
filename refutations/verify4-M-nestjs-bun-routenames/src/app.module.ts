import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { AppController } from './app.controller';

@Module({
  imports: [SentryModule.forRoot()],
  controllers: [AppController],
  providers: [{ provide: APP_FILTER, useClass: SentryGlobalFilter }],
})
export class AppModule {}
