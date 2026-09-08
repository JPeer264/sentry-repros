import './instrument';
import * as Sentry from '@sentry/elysia';
import { Elysia } from 'elysia';

const echoPort = Number(process.env.ECHO_PORT);

const app = Sentry.withElysia(new Elysia())
  .get('/user/:id', async ({ params }) => {
    const res = await fetch(`http://127.0.0.1:${echoPort}/downstream/${params.id}`);
    return { id: params.id, echoed: await res.json() };
  })
  .get('/error', () => {
    throw new Error('elysia boom');
  })
  .get('/sentinel', () => {
    Sentry.captureMessage('sentinel');
    return 'ok';
  })
  .listen(Number(process.env.PORT));

console.log('LISTENING', app.server?.port);
