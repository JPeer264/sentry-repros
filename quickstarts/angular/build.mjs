// Builds one variant into dist/<variant> with the Angular CLI. Usage: node build.mjs <variant>
// Every variant is a configuration of the one project in angular.json that overrides the entry
// (`browser`), its tsconfig and the output path; `production` is merged in front of it. The CLI's
// output goes to build-<variant>.log. A variant that does not build is a result too: its error
// lines are written to results-<variant>.json and the run stops.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const variant = process.argv[2] ?? 'base';
const mode = process.env.MODE === 'development' ? 'development' : 'production';
const resultName = process.env.RESULT_NAME ?? `results-${variant}`;

const started = Date.now();
const res = spawnSync('node', ['node_modules/@angular/cli/bin/ng.js', 'build', '--configuration', `${mode},${variant}`], {
  cwd: HERE,
  env: { ...process.env, NG_CLI_ANALYTICS: 'false', NO_COLOR: '1', CI: '1' },
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
const output = `${res.stdout ?? ''}${res.stderr ?? ''}`;
const seconds = Math.round((Date.now() - started) / 100) / 10;
writeFileSync(new URL(`./build-${variant}${mode === 'development' ? '-dev' : ''}.log`, import.meta.url), output);

if (res.status !== 0) {
  const errors = output
    .split('\n')
    .filter(l => /error|✘|TS\d{4}|NG\d{4}/i.test(l))
    .map(l => l.trim())
    .filter(Boolean);
  writeFileSync(new URL(`./${resultName}.json`, import.meta.url), JSON.stringify({ variant, mode, build: { ok: false, seconds, errors, output: output.split('\n').slice(-60) } }, null, 2));
  console.error(`build failed after ${seconds}s, wrote ${resultName}.json`);
  process.exit(1);
}
console.log(`built dist/${variant} in ${seconds}s`);
