// Builds one variant into dist/<variant>.js. Usage: node build.mjs <variant>
// esbuild + esbuild-svelte stand in for Vite: the variant's svelte.config*.js (the docs' file) is
// imported and its `preprocess` and `compilerOptions` are handed to the plugin, which is what
// @sveltejs/vite-plugin-svelte does with the same file. MODE=development compiles with
// `compilerOptions.dev = true`, the way a Vite dev server does.
import { build } from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import { readFileSync, writeFileSync } from 'node:fs';
const svelteVersion = JSON.parse(readFileSync('node_modules/svelte/package.json', 'utf8')).version;

const variant = process.argv[2] ?? 'base';
const mode = process.env.MODE === 'development' ? 'development' : 'production';
const resultName = process.env.RESULT_NAME ?? `results-${variant}`;

const SRC = { 'component-tracking-options': 'component-tracking' }[variant] ?? variant;
const CONFIG = {
  'component-tracking': './svelte.config.js',
  'component-tracking-options': './svelte.config.options.js',
}[variant];

const svelteConfig = CONFIG ? (await import(CONFIG)).default : { compilerOptions: {} };
const preprocessors = [].concat(svelteConfig.preprocess ?? []);
const svelteWarnings = [];

try {
  const result = await build({
    entryPoints: [`src/${SRC}/main.js`],
    outfile: `dist/${variant}.js`,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    define: { 'process.env.NODE_ENV': JSON.stringify(mode), __SVELTE_VERSION__: JSON.stringify(svelteVersion) },
    plugins: [
      sveltePlugin({
        compilerOptions: { ...svelteConfig.compilerOptions, dev: mode === 'development' },
        preprocess: preprocessors.length ? preprocessors : undefined,
        filterWarnings: w => {
          svelteWarnings.push({ code: w.code, message: w.message, filename: w.filename, line: w.start?.line });
          return true;
        },
      }),
    ],
    sourcemap: false,
    logLevel: 'info',
  });
  writeFileSync(
    `dist/${variant}.build.json`,
    JSON.stringify(
      {
        ok: true,
        mode,
        src: `src/${SRC}/main.js`,
        svelteConfig: CONFIG ?? null,
        preprocessors: preprocessors.map(p => p.sentryId ?? Object.keys(p).join(',')),
        esbuildWarnings: result.warnings.map(w => ({ text: w.text, file: w.location?.file, line: w.location?.line })),
        svelteWarnings,
      },
      null,
      2,
    ),
  );
} catch (e) {
  // A snippet that does not build is a result too: record the messages and stop the run.
  const errors = (e.errors || []).map(m => ({ text: m.text, file: m.location?.file, line: m.location?.line, column: m.location?.column, lineText: m.location?.lineText }));
  writeFileSync(`${resultName}.json`, JSON.stringify({ variant, mode, build: { ok: false, svelteConfig: CONFIG ?? null, errors, svelteWarnings, message: errors.length ? undefined : String(e?.stack ?? e) } }, null, 2));
  console.error(`build failed, wrote ${resultName}.json`);
  process.exit(1);
}
