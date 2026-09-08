import '@sentry/deno/import';
// D02 probe: enrichment on Deno events (user, tags, extra, context, breadcrumbs, contexts, context lines)
import * as Sentry from '@sentry/deno';

const [portArg, labelArg] = Deno.args;
const port = portArg ?? '9999';
const label = labelArg ?? 'nohook';

Sentry.init({
  dsn: 'https://d02probe@o0.ingest.sentry.io/0',
  tunnel: `http://127.0.0.1:${port}/`,
  release: 'd02@1.0.0',
  environment: 'probe',
});

Sentry.setUser({ id: 'u-42', email: 'u42@example.com', username: 'u42' });
Sentry.setTags({ probe: 'D02', run: label });
Sentry.setExtra('probe_extra', { list: [1, 2, 3] });
Sentry.setContext('probe_ctx', { label, answer: 42 });

Sentry.addBreadcrumb({ category: 'manual', level: 'info', message: 'manual breadcrumb', data: { step: 1 } });
console.log('console log breadcrumb', { n: 1 });
console.warn('console warn breadcrumb');

await fetch(`http://127.0.0.1:${port}/__target`).then(r => r.text());

function innerThrow() {
  throw new Error(`D02 boom ${label}`);
}

try {
  innerThrow();
} catch (e) {
  Sentry.captureException(e);
}

Sentry.captureMessage('sentinel');
await Sentry.flush(5000);
