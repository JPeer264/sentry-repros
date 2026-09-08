import { Controller, Get, Param, Query } from '@nestjs/common';
import * as Sentry from '@sentry/bun';
import mysql from 'mysql';

const connection = mysql.createConnection({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'app',
});

const SINK = `http://127.0.0.1:${process.env.SINK_PORT || 9999}`;

@Controller()
export class AppController {
  @Get('users/:id')
  user(@Param('id') id: string) {
    return { id };
  }

  @Get('error')
  error() {
    throw new Error('nest boom');
  }

  @Get('isolated')
  async isolated(@Query('tag') tag: string) {
    Sentry.setTag('req', tag);
    await new Promise(resolve => setTimeout(resolve, 60));
    Sentry.captureException(new Error(`iso ${tag}`));
    return { tag };
  }

  @Get('db')
  async db() {
    const rows = await new Promise((resolve, reject) => {
      connection.query('SELECT id, name FROM users', (err: unknown, res: unknown) =>
        err ? reject(err) : resolve(res),
      );
    });
    return { rows };
  }

  @Get('downstream')
  async downstream() {
    const res = await fetch(`${SINK}/rec/downstream`);
    return { status: res.status };
  }

  @Get('log')
  log() {
    Sentry.logger.info('hello from nest on bun', { route: '/log' });
    return { ok: true };
  }

  @Get('sentinel')
  sentinel() {
    Sentry.captureMessage('sentinel');
    return { ok: true };
  }
}
