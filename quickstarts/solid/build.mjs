// Builds one variant into dist/<variant>.js. Usage: node build.mjs <variant>
// esbuild + esbuild-plugin-solid (babel-preset-solid) stand in for Vite + vite-plugin-solid.
// MODE=development adds the `development` export condition, which is what a Vite dev server does:
// solid-js then resolves to dist/dev.js, where the `DEV` export the guide's `if (!DEV)` reads is truthy.
import { build } from 'esbuild';
import { solidPlugin } from 'esbuild-plugin-solid';
import { readFileSync, writeFileSync } from 'node:fs';

const variant = process.argv[2] ?? 'base';
const mode = process.env.MODE === 'development' ? 'development' : 'production';
const resultName = process.env.RESULT_NAME ?? `results-${variant}`;
const version = pkg => {
  try {
    return JSON.parse(readFileSync(`node_modules/${pkg}/package.json`, 'utf8')).version;
  } catch {
    return null;
  }
};
const conditions = mode === 'development' ? ['development'] : [];

try {
  const result = await build({
    entryPoints: [`src/${variant}/index.jsx`],
    outfile: `dist/${variant}.js`,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    conditions,
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      __SOLID_VERSION__: JSON.stringify(version('solid-js')),
      __ROUTER_VERSION__: JSON.stringify(version('@solidjs/router')),
    },
    plugins: [solidPlugin()],
    sourcemap: false,
    logLevel: 'info',
  });
  writeFileSync(
    `dist/${variant}.build.json`,
    JSON.stringify(
      {
        ok: true,
        mode,
        src: `src/${variant}/index.jsx`,
        conditions,
        esbuildWarnings: result.warnings.map(w => ({ text: w.text, file: w.location?.file, line: w.location?.line })),
      },
      null,
      2,
    ),
  );
} catch (e) {
  // A snippet that does not build is a result too: record the messages and stop the run.
  const errors = (e.errors || []).map(m => ({ text: m.text, file: m.location?.file, line: m.location?.line, column: m.location?.column, lineText: m.location?.lineText }));
  writeFileSync(`${resultName}.json`, JSON.stringify({ variant, mode, build: { ok: false, conditions, errors, message: errors.length ? undefined : String(e?.stack ?? e) } }, null, 2));
  console.error(`build failed, wrote ${resultName}.json`);
  process.exit(1);
}
