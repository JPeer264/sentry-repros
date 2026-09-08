import './instrument';
import * as Sentry from '@sentry/bun';

const port = process.env.SINK_PORT || '47291';

const sdkVersion = Sentry.getClient()?.getSdkMetadata()?.sdk?.version;
console.log(
  `SDK ${sdkVersion} bun ${Bun.version} metrics keys: ${Object.keys(Sentry.metrics).sort().join(',')}`,
);

Sentry.metrics.count('probe.count', 1, { attributes: { route: '/x' } });
Sentry.metrics.gauge('probe.gauge', 42, { unit: 'millisecond', attributes: { route: '/x' } });
Sentry.metrics.distribution('probe.distribution', 3.5, { unit: 'second', attributes: { route: '/x' } });

// metrics flush on the ~5s timer
await Bun.sleep(7000);

const items = await fetch(`http://127.0.0.1:${port}/__items`).then(r => r.json());
console.log('SINK:', JSON.stringify(items.filter((i: any) => i.type === 'trace_metric')));
process.exit(0);
