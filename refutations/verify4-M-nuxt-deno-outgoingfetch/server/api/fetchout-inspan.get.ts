import * as Sentry from '@sentry/nuxt';

export default defineEventHandler(async () => {
  return await Sentry.startSpan({ name: 'manual-root-fetch', op: 'probe.manual' }, async () => {
    const res = await fetch(`http://127.0.0.1:${process.env.REC_PORT || '34012'}/rec-inspan`);
    return { ok: res.ok, body: await res.text() };
  });
});
