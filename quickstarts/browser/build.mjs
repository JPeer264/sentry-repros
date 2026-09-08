// Builds one variant bundle into dist/. Usage: node build.mjs <npm|cjs|late>
import { build } from 'esbuild';

const variant = process.argv[2] ?? 'npm';

const shared = {
  bundle: true,
  platform: 'browser',
  target: 'es2020',
  sourcemap: false,
  logLevel: 'info',
};

const configs = {
  npm: { entryPoints: ['src/app-npm.js'], outfile: 'dist/app-npm.js', format: 'esm' },
  cjs: { entryPoints: ['src/app-cjs.js'], outfile: 'dist/app-cjs.js', format: 'iife' },
  late: { entryPoints: ['src/app-late.js'], outfile: 'dist/app-late.js', format: 'esm' },
};

if (!configs[variant]) {
  console.error(`unknown build variant ${variant}`);
  process.exit(1);
}

await build({ ...shared, ...configs[variant] });
