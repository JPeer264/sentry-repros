import { Controller, Get, Param } from '@nestjs/common';
import * as Sentry from '@sentry/bun';
import { queryUsers } from './db';

@Controller()
export class AppController {
  @Get('/users/:id')
  getUser(@Param('id') id: string): { id: string } {
    return { id };
  }

  @Get('/db')
  async db(): Promise<unknown> {
    return await queryUsers();
  }

  @Get('/sentinel')
  sentinel(): string {
    Sentry.captureMessage('sentinel');
    return 'ok';
  }
}
