import { Controller, Get } from '@nestjs/common';
import * as Sentry from '@sentry/cloudflare';
import { queryUsers, queryPool2, queryFresh2, execFresh2, queryFresh1 } from './db';

async function run(fn: () => Promise<unknown>): Promise<object> {
  try {
    return { ok: true, rows: await fn() };
  } catch (e: any) {
    return { ok: false, err: String(e?.stack || e).split('\n').slice(0, 3).join(' | ') };
  }
}

@Controller()
export class AppController {
  @Get('/db')
  db(): Promise<object> {
    return run(queryUsers);
  }

  @Get('/db2pool')
  db2pool(): Promise<object> {
    return run(() => queryPool2(true));
  }

  @Get('/db2pool-eval')
  db2poolEval(): Promise<object> {
    return run(() => queryPool2(false));
  }

  @Get('/db2fresh')
  db2fresh(): Promise<object> {
    return run(() => queryFresh2(true));
  }

  @Get('/db2fresh-eval')
  db2freshEval(): Promise<object> {
    return run(() => queryFresh2(false));
  }

  @Get('/db2exec')
  db2exec(): Promise<object> {
    return run(execFresh2);
  }

  @Get('/dbfresh')
  dbfresh(): Promise<object> {
    return run(queryFresh1);
  }

  @Get('/sentinel')
  sentinel(): string {
    Sentry.captureMessage('sentinel');
    return 'ok';
  }
}
