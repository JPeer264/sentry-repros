import * as esbuild from 'esbuild';
import { builtinModules } from 'node:module';
import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';

const BUILTINS = new Set(builtinModules.filter(m => !m.startsWith('node:')));
const used = new Set();

// esbuild's ESM output turns every `require('<builtin>')` inside a CJS dependency into
// its `__require` stub, which throws. That stub defers to a global `require` when one
// exists, so collect the builtins the bundle asks for and hand them back from static
// `node:` imports in the banner.
const collect = {
  name: 'collect-node-builtins',
  setup(build) {
    build.onResolve({ filter: /^(node:)?[a-z_]+(\/[a-z_]+)?$/ }, args => {
      const bare = args.path.replace(/^node:/, '');
      if (!BUILTINS.has(bare)) return null;
      used.add(bare);
      return { path: `node:${bare}`, external: true };
    });
  },
};

const common = {
  entryPoints: ['worker.ts'],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  mainFields: ['module', 'main'],
  target: 'es2022',
  conditions: ['workerd', 'worker', 'browser', 'import', 'module', 'default'],
  logLevel: 'silent',
  plugins: [collect, sentryOrchestrionPlugin()],
};

await esbuild.build({ ...common, outfile: 'dist3/probe.mjs' });

const names = [...used].sort();
console.log('builtins used:', names.join(', '));
const banner = [
  ...names.map((n, i) => `import * as __nb${i} from ${JSON.stringify('node:' + n)};`),
  `const __nbMap = { ${names.map((n, i) => `${JSON.stringify(n)}: __nb${i}`).join(', ')} };`,
  'globalThis.require = function (id) {',
  '  const m = __nbMap[String(id).replace(/^node:/, "")];',
  '  if (!m) throw new Error("Cannot find module " + id);',
  '  return m.default !== undefined ? m.default : m;',
  '};',
].join('\n');

const result = await esbuild.build({ ...common, outfile: 'dist3/worker.mjs', banner: { js: banner } });
console.log('warnings', result.warnings.length);
