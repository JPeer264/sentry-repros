import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react-swc';
import { nitro } from 'nitro/vite';
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite';

const appDsn = 'http://public@localhost:41733/1337';
const appTunnel = 'http://127.0.0.1:41733/';

export default defineConfig({
  define: {
    __APP_DSN__: JSON.stringify(appDsn),
    __APP_TUNNEL__: JSON.stringify(appTunnel),
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart(),
    nitro(),
    viteReact(),
    sentryTanstackStart({
      debug: true,
      sourcemaps: { disable: true },
    }),
  ],
});
