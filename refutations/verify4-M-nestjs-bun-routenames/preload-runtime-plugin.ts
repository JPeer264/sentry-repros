import { plugin } from 'bun';
import { sentryBunPlugin } from '@sentry/bun/plugin';

const g: any = ((globalThis as any).__SENTRY_ORCHESTRION__ ??= {});
g.bundler ??= new Set();

plugin(sentryBunPlugin() as any);
console.log('[probe] runtime plugin registered');
