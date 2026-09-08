import * as Sentry from '@sentry/bun';

const g = globalThis as any;
g.__instrumentEvals = (g.__instrumentEvals ?? 0) + 1;

const clientBeforeInit = !!Sentry.getClient();
const prevClient = g.__lastClient;

Sentry.init({
  dsn: 'http://publickey@127.0.0.1:51811/1',
  tunnel: 'http://127.0.0.1:51811/',
  tracesSampleRate: 1.0,
  debug: !!process.env.SENTRY_DEBUG,
});

const client = Sentry.getClient();
g.__lastClient = client;

console.log(
  `[instrument] evaluated#${g.__instrumentEvals} pid=${process.pid} ` +
    `clientBeforeInit=${clientBeforeInit} clientAfterInit=${!!client} ` +
    `sameClientAsBefore=${prevClient !== undefined && prevClient === client}`,
);
