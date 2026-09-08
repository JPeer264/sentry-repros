import './instrument.ts';
import 'reflect-metadata';

import { Controller, Get, Module } from '@nestjs/common';
import { APP_FILTER, NestFactory } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import * as Sentry from '@sentry/nestjs';
import * as http from 'node:http';

const REC = `http://127.0.0.1:${Deno.env.get('REC_PORT')}`;

function nodeHttpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, res => {
      let body = '';
      res.on('data', c => (body += c));
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
  });
}

@Controller()
export class AppController {
  @Get('/downstream')
  async downstream(): Promise<string> {
    const res = await fetch(`${REC}/recorded-fetch`);
    return await res.text();
  }

  @Get('/downstream-request')
  async downstreamRequest(): Promise<string> {
    const res = await fetch(new Request(`${REC}/recorded-fetch-request`));
    return await res.text();
  }

  @Get('/nodehttp')
  async nodehttp(): Promise<string> {
    return await nodeHttpGet(`${REC}/recorded-nodehttp`);
  }

  @Get('/undicifetch')
  async undicifetch(): Promise<string> {
    const { fetch: undiciFetch } = await import('undici');
    const res = await undiciFetch(`${REC}/recorded-undici`);
    return await res.text();
  }

  @Get('/sentinel')
  sentinel(): string {
    Sentry.captureMessage('sentinel');
    return 'ok';
  }
}

@Module({
  imports: [SentryModule.forRoot()],
  controllers: [AppController],
  providers: [{ provide: APP_FILTER, useClass: SentryGlobalFilter }],
})
export class AppModule {}

const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
await app.listen(Number(Deno.env.get('APP_PORT')));
console.log(`APP_LISTENING ${Deno.env.get('APP_PORT')}`);
