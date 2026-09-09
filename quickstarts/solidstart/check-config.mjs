// Evaluates the page's config-time snippets against what `npm install @solidjs/start` gives today
// (SolidStart 2): index.mdx:214-231 (withSentry + defineConfig from @solidjs/start/config) and
// features/middleware.mdx:11 (the @sentry/solidstart/middleware subpath). Writes results-check-config.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const out = { variant: 'check-config', steps: [] };

async function tryImport(label, spec, fn) {
  try {
    const mod = await import(spec);
    const result = fn ? await fn(mod) : null;
    out.steps.push({ label, spec, ok: true, exports: Object.keys(mod).sort(), result });
  } catch (e) {
    out.steps.push({ label, spec, ok: false, error: `${e?.code ?? ''} ${e?.message ?? e}`.trim() });
  }
}

await tryImport('index.mdx:216 defineConfig from @solidjs/start/config', '@solidjs/start/config', m => ({ defineConfig: typeof m.defineConfig, solidStart: typeof m.solidStart }));
await tryImport('index.mdx:215 withSentry from @sentry/solidstart', '@sentry/solidstart', m => {
  const r = m.withSentry({ middleware: './src/middleware.ts' }, { instrumentation: './mypath/instrument.server.ts' });
  return { withSentry: typeof m.withSentry, returned: Object.keys(r ?? {}), sentryBeforeResponseMiddleware: typeof m.sentryBeforeResponseMiddleware, withSentryErrorBoundary: typeof m.withSentryErrorBoundary, withServerActionInstrumentation: typeof m.withServerActionInstrumentation };
});
await tryImport('features/middleware.mdx:11 @sentry/solidstart/middleware', '@sentry/solidstart/middleware');
await tryImport('develop: @sentry/solidstart/vite', '@sentry/solidstart/vite', m => ({ sentrySolidStart: typeof m.sentrySolidStart, sentrySolidStartVite: typeof m.sentrySolidStartVite }));
await tryImport('index.mdx:97 @sentry/solidstart/solidrouter', '@sentry/solidstart/solidrouter', m => ({ solidRouterBrowserTracingIntegration: typeof m.solidRouterBrowserTracingIntegration, withSentryRouterRouting: typeof m.withSentryRouterRouting }));
try {
  require.resolve('vinxi');
  out.steps.push({ label: 'index.mdx:297 vinxi (start:vinxi script)', ok: true });
} catch (e) {
  out.steps.push({ label: 'index.mdx:297 vinxi (start:vinxi script)', ok: false, error: `${e.code}: vinxi is not a dependency of @solidjs/start@2` });
}
const pkg = p => JSON.parse(readFileSync(new URL(`./node_modules/${p}/package.json`, import.meta.url), 'utf8'));
out.pkg = { '@solidjs/start': pkg('@solidjs/start').version, '@sentry/solidstart': pkg('@sentry/solidstart').version, exports: Object.keys(pkg('@sentry/solidstart').exports) };
writeFileSync(new URL('./results-check-config.json', import.meta.url), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.steps.map(s => `${s.ok ? 'ok ' : 'ERR'} ${s.label}${s.error ? ' -> ' + s.error : ''}`), null, 1));
