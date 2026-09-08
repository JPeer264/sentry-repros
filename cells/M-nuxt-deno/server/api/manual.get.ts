import * as Sentry from '@sentry/nuxt';

export default defineEventHandler(async () => {
  return await Sentry.startSpan({ name: 'manual-root', op: 'probe.manual' }, async () => {
    return await Sentry.startSpan({ name: 'manual-child', op: 'probe.child' }, async () => ({ manual: true }));
  });
});
