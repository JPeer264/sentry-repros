import { Controller, Get, Param } from '@nestjs/common';
import * as Sentry from '@sentry/bun';

@Controller()
export class AppController {
  @Get('users/:id')
  getUser(@Param('id') id: string): { id: string } {
    return { id };
  }

  @Get('sentinel')
  sentinel(): string {
    Sentry.captureMessage('sentinel');
    return 'ok';
  }
}
