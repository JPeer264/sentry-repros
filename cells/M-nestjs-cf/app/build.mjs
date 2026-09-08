import { build } from 'esbuild';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';
const stub = new URL('./stub.js', import.meta.url).pathname;
const processShim = new URL('./process-shim.cjs', import.meta.url).pathname;
const processPlugin = {
  name: 'process-shim',
  setup(b) {
    b.onResolve({ filter: /^(node:)?process$/ }, () => ({ path: processShim }));
  },
};
await build({
  entryPoints: ['build/main.js'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  outfile: 'dist/worker.js',
  external: ['cloudflare:*', 'node:*', '@sentry/cloudflare'],
  alias: {
    'class-validator': stub,
    'class-transformer': stub,
    '@nestjs/websockets/socket-module': stub,
    '@nestjs/microservices/microservices-module': stub,
    '@nestjs/microservices': stub,
    '@nestjs/platform-socket.io': stub,
  },
  banner: { js: [
    "import { createRequire as __cfCreateRequire } from 'node:module';",
    "const __cfReq = __cfCreateRequire('/');",
    "function require(id) { return __cfReq(id.startsWith('node:') ? id.slice(5) : id); }",
    "require.resolve = (id) => __cfReq.resolve(id.startsWith('node:') ? id.slice(5) : id);",
  ].join('\n') },
  plugins: [processPlugin, sentryOrchestrionPlugin()],
  logLevel: 'warning',
  logLimit: 0,
});
console.log('bundled');
