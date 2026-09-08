import './instrument';
import * as Sentry from '@sentry/elysia';

const client = Sentry.getClient()!;
const options = client.getOptions() as Record<string, unknown>;
console.log('sdk metadata:', JSON.stringify((options as any)._metadata?.sdk));
console.log('traceLifecycle:', (options as any).traceLifecycle);
console.log('integrations:', ((options as any).integrations as { name: string }[]).map(i => i.name).join(', '));
