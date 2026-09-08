import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react-swc';
import { nitro } from 'nitro/vite';
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite';

const appDsn = 'https://public@example.invalid/1';

const sentryExternals = [
  '@sentry/tanstackstart-react',
  '@sentry/node',
  '@sentry/core',
  '@sentry/opentelemetry',
  '@sentry/server-utils',
  '@sentry/server-runtime-injection',
  '@sentry/conventions',
  '@sentry/bun',
];

export default defineConfig({
  ssr: {
    external: sentryExternals,
  },
  define: {
    __APP_DSN__: JSON.stringify(appDsn),
    __APP_TUNNEL__: 'undefined',
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart(),
    nitro(),
    viteReact(),
    ...(process.env.PROBE_NO_SENTRY_VITE === '1' ? [] : [sentryTanstackStart({ debug: true })]),
  ],
});
