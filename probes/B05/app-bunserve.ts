import './instrument';
import * as Sentry from '@sentry/bun';

const port = Number(process.env.APP_PORT);

const server = Bun.serve({
  port,
  fetch(req) {
    const { pathname } = new URL(req.url);
    if (pathname === '/error') {
      throw new Error('bunserve boom');
    }
    if (pathname === '/sentinel') {
      Sentry.captureMessage('sentinel');
      return new Response('sentinel');
    }
    if (pathname === '/stop') {
      setTimeout(() => server.stop(true), 50);
      return new Response('stopping');
    }
    return new Response('ok');
  },
});

console.log('bunserve listening on', port);
