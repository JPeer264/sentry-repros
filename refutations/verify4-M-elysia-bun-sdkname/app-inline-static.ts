import * as Sentry from '@sentry/elysia';
import { Elysia } from 'elysia';

Sentry.init({
  dsn: 'https://public@example.com/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
});
console.log('CLIENT_SDK_METADATA=' + JSON.stringify(Sentry.getClient()?.getOptions()._metadata));
Sentry.withElysia(new Elysia())
  .get('/users/:id', ({ params }) => ({ id: params.id }))
  .get('/boom', () => { throw new Error('elysia-boom'); })
  .get('/sentinel', () => { Sentry.captureMessage('sentinel'); return 'ok'; })
  .listen(Number(process.env.APP_PORT));
console.log('LISTENING');
