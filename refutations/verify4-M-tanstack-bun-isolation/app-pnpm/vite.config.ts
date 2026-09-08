import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react-swc';
import { nitro } from 'nitro/vite';
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite';

const tunnelRouteMode = process.env.E2E_TEST_TUNNEL_ROUTE_MODE ?? 'off';
const useManagedTunnelRoute = tunnelRouteMode !== 'off';
const useCustomTunnelRoute = process.env.E2E_TEST_CUSTOM_TUNNEL_ROUTE === '1';

const appDsn =
  useManagedTunnelRoute || useCustomTunnelRoute
    ? 'http://public@localhost:3031/1337'
    : 'https://public@dsn.ingest.sentry.io/1337';

const appTunnel = useManagedTunnelRoute
  ? undefined
  : useCustomTunnelRoute
    ? '/custom-monitor'
    : 'http://localhost:3031/';

function resolveTunnelRouteOption() {
  switch (tunnelRouteMode) {
    case 'dynamic':
      return true;
    case 'static':
      return '/monitor';
    case 'object':
      return { path: '/object-monitor', allowedDsns: [appDsn] };
    default:
      return undefined;
  }
}

const tunnelRoute = resolveTunnelRouteOption();

export default defineConfig({
  server: {
    port: 3000,
  },
  define: {
    __APP_DSN__: JSON.stringify(appDsn),
    __APP_TUNNEL__: appTunnel === undefined ? 'undefined' : JSON.stringify(appTunnel),
  },
  plugins: [
    {
      name: 'sentry-keep-runtime-injection-external',
      enforce: 'pre',
      resolveId(this: any, id: string) {
        const envName = this.environment?.name;
        if (envName === 'client') return null;
        if (/^@sentry\//.test(id) || id === '@opentelemetry/api' || id.startsWith('@opentelemetry/')) {
          return { id, external: true };
        }
        return null;
      },
    },
    tsConfigPaths(),
    tanstackStart(),
    nitro(),
    // react's vite plugin must come after start's vite plugin
    viteReact(),
    sentryTanstackStart({
      debug: true,
      tunnelRoute,
    }),
  ],
});
