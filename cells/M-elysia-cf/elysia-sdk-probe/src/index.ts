import { withElysia } from '@sentry/elysia';
import * as Sentry from '@sentry/cloudflare';
import { Elysia } from 'elysia';

const app = withElysia(new Elysia({ aot: false }))
  .get('/users/:id', ({ params }) => ({ id: params.id }))
  .get('/p/:id/boom', () => {
    throw new Error('elysia-sdk-param-boom');
  })
  .get('/iso/:tag', ({ params }) => {
    Sentry.setTag('reqtag', params.tag);
    Sentry.captureException(new Error(`iso-${params.tag}`));
    return { tag: params.tag };
  })
  .get('/fetch', async () => {
    const res = await fetch('http://127.0.0.1:52742/recorded-sdk');
    return { recorder: await res.text() };
  })
  .get('/log', () => {
    Sentry.logger.info('hello from withElysia handler', { where: 'cf' });
    return 'logged';
  })
  .get('/sentinel', () => {
    Sentry.captureMessage('sentinel');
    return 'sentinel';
  });

export default Sentry.withSentry(
  (env: any) => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: 'http://127.0.0.1:52745/',
    tracesSampleRate: 1.0,
    traceLifecycle: (env.TRACE_LIFECYCLE as 'static' | 'stream') || 'static',
    debug: true,
    sendDefaultPii: true,
  }),
  { fetch: (request: Request) => app.fetch(request) },
);
