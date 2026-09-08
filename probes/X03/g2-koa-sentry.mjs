import '@sentry/deno/import';

try {
  const m = await import('koa');
  console.log(`RESULT g2-koa-sentry: ok typeof=${typeof (m.default ?? m)}`);
} catch (e) {
  console.log(`RESULT g2-koa-sentry: FAIL ${e.name}: ${e.message}`);
}
