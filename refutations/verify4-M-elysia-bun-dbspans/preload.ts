import { sentryBunPlugin } from '@sentry/bun/plugin';

(globalThis as any).__SENTRY_ORCHESTRION__ = { bundler: new Set() };
Bun.plugin(sentryBunPlugin() as any);
