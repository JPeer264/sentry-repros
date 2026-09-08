import './instrument';
import 'reflect-metadata';
import { Controller, Get, Module, Param } from '@nestjs/common';
import { APP_FILTER, NestFactory } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import * as Sentry from '@sentry/bun';

@Controller('cats')
class CatsController {
  @Get(':id')
  getCat(@Param('id') id: string) {
    return { id, name: 'Kitty' };
  }
}

@Controller()
class RootController {
  @Get('boom')
  boom() {
    throw new Error('boom from nest');
  }

  @Get('sentinel')
  sentinel() {
    Sentry.captureMessage('sentinel');
    return { ok: true };
  }
}

@Module({
  controllers: [CatsController, RootController],
  providers: process.env.SENTRY_FILTER === '1' ? [{ provide: APP_FILTER, useClass: SentryGlobalFilter }] : [],
})
class AppModule {}

const app = await NestFactory.create(AppModule);
await app.listen(Number(process.env.PORT || 41874));
console.log(`app listening on ${process.env.PORT || 41874}`);
