import './instrument';
import * as Sentry from '@sentry/elysia';
import { Elysia } from 'elysia';

const client = Sentry.getClient();
console.log('CLIENT_SDK_METADATA=' + JSON.stringify(client?.getOptions()._metadata));

const app = Sentry.withElysia(new Elysia())
  .get('/users/:id', ({ params }) => ({ id: params.id }))
  .get('/boom', () => { throw new Error('elysia-boom'); })
  .get('/sentinel', () => { Sentry.captureMessage('sentinel'); return 'ok'; })
  .listen(Number(process.env.APP_PORT));
console.log('LISTENING');
