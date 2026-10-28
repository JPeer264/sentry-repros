import * as Sentry from '@sentry/node';

// Prints each check-in, and sends it to Sentry when `SENTRY_DSN` is set.
function loggingTransport(options) {
  const transport = process.env.SENTRY_DSN ? Sentry.makeNodeTransport(options) : undefined;
  return {
    send(envelope) {
      for (const [header, item] of envelope[1]) {
        if (header.type === 'check_in') {
          const config = item.monitor_config ? `config "${item.monitor_config.schedule.value}"` : '';
          console.log(`SDK sends  ${item.monitor_slug.padEnd(14)} ${item.status.padEnd(12)} ${config}`);
        }
      }
      return transport ? transport.send(envelope) : Promise.resolve({});
    },
    flush: timeout => (transport ? transport.flush(timeout) : Promise.resolve(true)),
  };
}

Sentry.init({
  dsn: process.env.SENTRY_DSN || 'https://public@dsn.ingest.sentry.io/1337',
  transport: loggingTransport,
  integrations: process.env.USE_INTEGRATION ? [Sentry.nodeScheduleIntegration()] : [],
});

console.log(
  process.env.SENTRY_DSN
    ? 'Sending the check-ins to Sentry.'
    : 'SENTRY_DSN is not set, so the check-ins are only printed, not sent.',
);
