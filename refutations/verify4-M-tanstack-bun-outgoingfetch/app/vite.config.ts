import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react-swc';
import { nitro } from 'nitro/vite';
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite';

const appDsn = 'https://public@example.invalid/1';

export default defineConfig({
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
