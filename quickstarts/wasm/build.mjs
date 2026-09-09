// Builds the wasm modules and one variant bundle into dist/. Usage: node build.mjs <npm|errors-only>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';
import initWabt from 'wabt';

const bundle = process.argv[2] ?? 'npm';

mkdirSync('dist', { recursive: true });

// src/divide.wat -> dist/divide.wasm. `write_debug_names` emits a name section so that Chrome
// prints `divide` instead of `wasm-function[0]` as the frame's function name.
const wabt = await initWabt();
const parsed = wabt.parseWat('divide.wat', readFileSync('src/divide.wat', 'utf8'));
const { buffer } = parsed.toBinary({ write_debug_names: true });
parsed.destroy();
writeFileSync('dist/divide.wasm', buffer);

// dist/divide-buildid.wasm: the same module plus the two custom sections @sentry/wasm reads
// (packages/wasm/src/registry.ts:17 and :29): `build_id` (16 bytes, what `wasm-split` writes)
// and `external_debug_info` (relative path of the split-off DWARF file).
function leb128(n) {
  const out = [];
  do {
    let b = n & 0x7f;
    n >>>= 7;
    if (n) b |= 0x80;
    out.push(b);
  } while (n);
  return Buffer.from(out);
}
function customSection(name, payload) {
  const nameBytes = Buffer.from(name, 'utf8');
  const body = Buffer.concat([leb128(nameBytes.length), nameBytes, Buffer.from(payload)]);
  return Buffer.concat([Buffer.from([0x00]), leb128(body.length), body]);
}
const BUILD_ID = Buffer.from('0123456789abcdef1032547698badcfe', 'hex');
const withBuildId = Buffer.concat([
  Buffer.from(buffer),
  customSection('build_id', BUILD_ID),
  customSection('external_debug_info', Buffer.from('divide.debug.wasm', 'utf8')),
]);
writeFileSync('dist/divide-buildid.wasm', withBuildId);

for (const file of ['divide.wasm', 'divide-buildid.wasm']) {
  const mod = new WebAssembly.Module(readFileSync(`dist/${file}`));
  console.log(
    `${file}: ${readFileSync(`dist/${file}`).length} bytes, exports ${WebAssembly.Module.exports(mod).map(e => e.name).join(',')}, ` +
      `build_id sections ${WebAssembly.Module.customSections(mod, 'build_id').length}, ` +
      `external_debug_info sections ${WebAssembly.Module.customSections(mod, 'external_debug_info').length}`,
  );
}

const configs = {
  npm: { entryPoints: ['src/app-npm.js'], outfile: 'dist/app-npm.js' },
  'errors-only': { entryPoints: ['src/app-errors.js'], outfile: 'dist/app-errors.js' },
};
if (!configs[bundle]) {
  console.error(`unknown bundle ${bundle}`);
  process.exit(1);
}
await build({
  bundle: true,
  platform: 'browser',
  target: 'es2020',
  format: 'esm',
  sourcemap: false,
  logLevel: 'info',
  ...configs[bundle],
});
