// Builds one variant into dist/<variant>.js. Usage: node build.mjs <variant>
// Components are plain objects with `template` strings, so `vue` is aliased to the full build
// (`vue/dist/vue.esm-bundler.js`, runtime + compiler) and no SFC compiler is needed. FULL_BUILD=0
// drops the alias to show what the default runtime-only export does with a `template` option.
// MODE=development switches Vue and @sentry/* to their development builds, the way a Vite dev
// server would resolve them. The three `__VUE_*` flags are what Vite defines by default.
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// The vue-router.mdx example imports `@/components/...`, the `@` -> `src` alias of a Vue CLI or
// Vite project; resolve it inside the variant directory so the snippet's other lines get linked.
const atAlias = {
  name: 'at-alias',
  setup(b) {
    b.onResolve({ filter: /^@\// }, args => ({ path: resolve(`src/${variant}`, args.path.slice(2) + '.js') }));
  },
};

const variant = process.argv[2] ?? 'base';
const mode = process.env.MODE === 'development' ? 'development' : 'production';
const fullBuild = process.env.FULL_BUILD !== '0';

try {
  await build({
    entryPoints: [`src/${variant}/main.js`],
    outfile: `dist/${variant}.js`,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    },
    conditions: mode === 'development' ? ['development'] : [],
    alias: fullBuild ? { vue: 'vue/dist/vue.esm-bundler.js' } : {},
    plugins: [atAlias],
    sourcemap: false,
    logLevel: 'info',
  });
} catch (e) {
  // A snippet that does not build is a result too: record esbuild's messages and stop the run.
  const errors = (e.errors || []).map(m => ({ text: m.text, file: m.location?.file, line: m.location?.line, column: m.location?.column, lineText: m.location?.lineText }));
  const resultName = process.env.RESULT_NAME ?? `results-${variant}`;
  writeFileSync(`${resultName}.json`, JSON.stringify({ variant, mode, build: { ok: false, errors } }, null, 2));
  console.error(`build failed, wrote ${resultName}.json`);
  process.exit(1);
}
