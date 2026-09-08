import { defineConfig, type Plugin } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react-swc';
import { nitro } from 'nitro/vite';
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite';

const appDsn = process.env.PROBE_DSN || 'https://public@dsn.ingest.sentry.io/1337';
const appTunnel = process.env.PROBE_TUNNEL || 'http://127.0.0.1:47313/';

const SHIM_PREFIX = '\0probe-sentry-shim:';

/**
 * Required build workaround. Without it nitro's SSR rollup pass resolves @sentry/* to their CJS
 * builds while resolving what those files require() to ESM, and rollup-plugin-commonjs emits
 * `import require$$0 from "@sentry/core"` against an ESM file with no default export, which fails
 * the build. Every @sentry/* import outside the client environment is replaced by a virtual module
 * that re-exports the package and adds a default export, and the package itself stays external.
 */
function sentryExternalShim(): Plugin {
  return {
    name: 'probe-sentry-external-shim',
    enforce: 'pre',
    resolveId(source, importer, options) {
      if (!source.startsWith('@sentry/')) {
        return null;
      }
      const isClient = this.environment?.name === 'client' || (!options?.ssr && this.environment == null);
      if (isClient) {
        return null;
      }
      if (importer?.startsWith(SHIM_PREFIX)) {
        return { id: source, external: true };
      }
      return SHIM_PREFIX + source;
    },
    load(id) {
      if (!id.startsWith(SHIM_PREFIX)) {
        return null;
      }
      const pkg = JSON.stringify(id.slice(SHIM_PREFIX.length));
      return `import * as ns from ${pkg};\nexport * from ${pkg};\nexport default ns;\n`;
    },
  };
}

export default defineConfig({
  define: {
    __APP_DSN__: JSON.stringify(appDsn),
    __APP_TUNNEL__: JSON.stringify(appTunnel),
  },
  plugins: [
    sentryExternalShim(),
    tsConfigPaths(),
    tanstackStart(),
    nitro(),
    // react's vite plugin must come after start's vite plugin
    viteReact(),
    sentryTanstackStart({ debug: true }),
  ],
});
