import "@sentry/deno/import";
// Docs-shaped Deno app: `import * as Sentry from "@sentry/deno"` + Sentry.init as the
// first thing the entry does, no module hook. Ports come from Deno.args because
// reading Deno.env would itself need --allow-env.
import * as Sentry from '@sentry/deno';
import { boom } from './src/boom.ts';

const SINK_PORT = Number(Deno.args[0]);
const APP_PORT = Number(Deno.args[1]);

Sentry.init({
  dsn: 'https://abc123@o0.ingest.sentry.io/1337',
  tunnel: `http://127.0.0.1:${SINK_PORT}/`,
  tracesSampleRate: 1.0,
  release: 'n1-release@1.0.0',
  environment: 'n1-environment',
});

Deno.serve({ port: APP_PORT, hostname: '127.0.0.1', onListen: () => console.log(`LISTENING ${APP_PORT}`) }, async (req) => {
  const url = new URL(req.url);
  if (url.pathname === '/sentinel') {
    Sentry.captureMessage('sentinel');
    await Sentry.flush(3000);
    return new Response('sentinel\n');
  }
  boom();
});
