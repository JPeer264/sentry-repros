// Builds one variant into dist/<variant>.js. Usage: node build.mjs <variant>
// MODE=development switches React and @sentry/* to their development builds, the way a Vite dev
// server would resolve them (Vite 6 adds the `development` export condition in dev).
import { build } from 'esbuild';

const variant = process.argv[2] ?? 'base';
const mode = process.env.MODE === 'development' ? 'development' : 'production';

const aliases = {
  // The v8 page is built against react-router@8 installed under an alias, so that every
  // snippet keeps its verbatim `from "react-router"` import.
  'react-router-v8': { 'react-router': 'react-router-v8' },
};

await build({
  entryPoints: [`src/${variant}/main.jsx`],
  outfile: `dist/${variant}.js`,
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  jsxDev: mode === 'development',
  loader: { '.js': 'jsx' },
  define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
  conditions: mode === 'development' ? ['development'] : [],
  alias: aliases[variant] ?? {},
  sourcemap: false,
  logLevel: 'info',
});
