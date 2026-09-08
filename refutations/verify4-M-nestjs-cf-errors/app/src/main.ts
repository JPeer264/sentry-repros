import 'reflect-metadata';
import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';

const PORT = 8080;

let booted: Promise<void> | undefined;

async function boot(): Promise<void> {
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('./app.module');
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  await app.listen(PORT);
}

const nodeHandler: any = httpServerHandler({ port: PORT });

const handler = {
  async fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> {
    booted ??= boot();
    await booted;
    return nodeHandler.fetch(request, env, ctx);
  },
};

export default Sentry.withSentry(
  () => ({
    dsn: 'https://abc123@o1.ingest.sentry.io/1',
    tunnel: 'http://127.0.0.1:41777/',
    tracesSampleRate: 1.0,
    traceLifecycle: 'stream' as const,
    sendDefaultPii: true,
  }),
  handler,
);
