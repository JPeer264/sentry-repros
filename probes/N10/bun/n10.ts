import './instrument';
import * as Sentry from '@sentry/bun';
import { deepBoom } from './lib/boom';

Bun.serve({
  port: Number(process.env.PORT ?? 44923),
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/error') deepBoom(process.env.MARKER ?? 'bun');
    if (url.pathname === '/sentinel') {
      Sentry.captureMessage('sentinel');
      return new Response('sentinel\n');
    }
    return new Response('ok\n');
  },
});
