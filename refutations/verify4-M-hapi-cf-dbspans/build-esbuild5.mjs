import * as esbuild from 'esbuild';
import path from 'node:path';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

// esbuild turns every `require()` left in a bundled CJS file into `__require()`,
// which throws on workerd. Both the orchestrion channel import
// (`require('diagnostics_channel')`) and the injected registration snippet's
// `require('@sentry/server-utils')` land there, as does every CJS dependency of
// Hapi. Back `__require` with static imports of the builtins workerd provides.
const BUILTINS = [
  'assert', 'async_hooks', 'buffer', 'crypto', 'diagnostics_channel', 'dns', 'events', 'http',
  'https', 'net', 'os', 'path', 'process', 'punycode', 'querystring', 'stream', 'string_decoder',
  'timers', 'tls', 'tty', 'url', 'util', 'zlib', 'perf_hooks', 'worker_threads', 'child_process', 'fs', 'module', 'v8', 'vm', 'constants', 'readline', 'http2', 'dgram', 'cluster', 'sys', 'wasi', 'inspector', 'fs/promises', 'stream/promises', 'stream/web', 'dns/promises', 'timers/promises', 'util/types', 'path/posix', 'assert/strict',
];
const imports = BUILTINS.map((n, i) => `import * as __b${i} from 'node:${n}';`).join('\n');
const entries = BUILTINS.flatMap((n, i) => [`'${n}': __b${i}`, `'node:${n}': __b${i}`]).join(', ');
const banner = `${imports}
const __nodeBuiltins = { ${entries} };
globalThis.require = id => {
  const mod = __nodeBuiltins[id];
  if (!mod) throw new Error('unsupported require: ' + id);
  return mod.default ?? mod;
};
`;

const forceEsmServerUtils = {
  name: 'force-esm-server-utils',
  setup(build) {
    build.onResolve({ filter: /^@sentry\/server-utils$/ }, () => ({
      path: path.resolve('./node_modules/@sentry/server-utils/build/esm/index.js'),
    }));
  },
};

const result = await esbuild.build({
  entryPoints: ['./src/index.mjs'],
  outfile: './dist-esbuild5/worker.mjs',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  external: ['cloudflare:*'],
  banner: { js: banner },
  plugins: [forceEsmServerUtils, sentryOrchestrionPlugin()],
  logLevel: 'info',
});
console.log('warnings', result.warnings.length, 'errors', result.errors.length);
