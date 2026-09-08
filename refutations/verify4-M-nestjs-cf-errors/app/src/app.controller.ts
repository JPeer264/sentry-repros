import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import * as Sentry from '@sentry/cloudflare';

@Controller()
export class AppController {
  @Get('/hello')
  hello(): string {
    return 'hello from nest';
  }

  @Get('/users/:id')
  user(@Param('id') id: string): object {
    return { id };
  }

  @Get('/error')
  boom(): string {
    throw new Error('nest-plain-error');
  }

  @Get('/error-async')
  async boomAsync(): Promise<string> {
    await new Promise(r => setTimeout(r, 10));
    throw new Error('nest-async-error');
  }

  @Get('/error-expected')
  boomExpected(): string {
    throw new NotFoundException('nest-expected-404');
  }

  @Get('/sentinel')
  sentinel(): string {
    Sentry.captureMessage('sentinel');
    return 'ok';
  }
}
