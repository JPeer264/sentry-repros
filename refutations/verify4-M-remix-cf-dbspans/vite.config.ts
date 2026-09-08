import { vitePlugin as remix } from '@remix-run/dev';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
import { defineConfig } from 'vite';

// PLUGIN: none | bare | noauto
// NOEXT: all | mysql | off
const mode = process.env.PLUGIN ?? 'bare';
const noext = process.env.NOEXT ?? 'all';

const sentryPlugins =
  mode === 'none'
    ? []
    : mode === 'bare'
      ? sentryCloudflareVitePlugin()
      : sentryCloudflareVitePlugin({ autoInstrumentation: false });

const noExternal =
  noext === 'all'
    ? true
    : noext === 'mysql'
      ? ['mysql']
      : noext === 'min'
        ? ['mysql', /^@sentry\//, '@opentelemetry/api']
        : undefined;

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: false,
        v3_lazyRouteDiscovery: true,
      },
    }),
    ...sentryPlugins,
  ],
  ssr: {
    target: 'webworker',
    resolve: { externalConditions: ['workerd', 'worker'] },
    ...(noExternal ? { noExternal } : {}),
  },
});
