import { vitePlugin as remix } from '@remix-run/dev';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
import { defineConfig } from 'vite';

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
    ...sentryCloudflareVitePlugin({ autoInstrumentation: false }),
  ],
  ssr: {
    target: 'webworker',
    resolve: { externalConditions: ['workerd', 'worker'] },
    noExternal: true,
  },
});
