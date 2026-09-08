import * as Sentry from '@sentry/cloudflare';
import Hapi from '@hapi/hapi';
import { httpServerHandler } from 'cloudflare:node';

const server = Hapi.server({ port: 8081, host: '0.0.0.0' });
server.route({ method: 'GET', path: '/ok', handler: () => ({ ok: true }) });
server.route({ method: 'GET', path: '/users/{id}', handler: req => ({ id: req.params.id }) });
await server.start();

export default Sentry.withSentry(
  () => ({ dsn: 'https://public@example.invalid/1', tunnel: 'http://127.0.0.1:41778/', tracesSampleRate: 1.0, traceLifecycle: 'static' }),
  httpServerHandler({ port: 8081 }),
);
