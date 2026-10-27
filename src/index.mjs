import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import codeTransformerVite from '@apm-js-collab/code-transformer-bundler-plugins/vite';

const pkgDir = join(mkdtempSync(join(tmpdir(), 'repro-')), 'node_modules', 'fake-db');
mkdirSync(pkgDir, { recursive: true });
writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({ name: 'fake-db', version: '1.0.0', type: 'module' }));
const file = join(pkgDir, 'index.mjs');
const code = 'export function query(sql) {\n  return sql;\n}\n';
writeFileSync(file, code);

const plugin = codeTransformerVite({
  instrumentations: [
    {
      channelName: 'query',
      module: { name: 'fake-db', versionRange: '>=1.0.0', filePath: 'index.mjs' },
      functionQuery: { functionName: 'query', kind: 'Sync' },
    },
  ],
});

// The second id is how Vite's dev server loads a dependency that it does not pre-bundle.
for (const id of [file, `${file}?v=1a2b3c4d`]) {
  const result = plugin.transform.handler.call({}, code, id);
  console.log(`${id.replace(pkgDir, 'node_modules/fake-db')}: ${result ? 'transformed' : 'not transformed'}`);
}
