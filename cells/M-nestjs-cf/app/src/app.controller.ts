import { Controller, Get, Param } from '@nestjs/common';
import * as Sentry from '@sentry/cloudflare';
import { queryUsers } from './db';

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

  @Get('/error-filtered')
  boomFiltered(): string {
    throw new Error('nest-filtered-error');
  }

  @Get('/iso/:tag')
  async iso(@Param('tag') tag: string): Promise<object> {
    Sentry.setTag('reqtag', tag);
    await new Promise(r => setTimeout(r, 150));
    Sentry.captureException(new Error(`iso-${tag}`));
    return { tag };
  }

  @Get('/fetchout')
  async fetchout(): Promise<object> {
    const res = await fetch('http://127.0.0.1:43529/rec');
    return { status: res.status };
  }

  @Get('/db')
  async db(): Promise<object> {
    const rows = await queryUsers();
    return { rows };
  }

  @Get('/logs')
  logs(): string {
    Sentry.logger.info('nest-cf-log-line', { where: 'handler' });
    return 'logged';
  }

  @Get('/sentinel')
  sentinel(): string {
    Sentry.captureMessage('sentinel');
    return 'ok';
  }
}
