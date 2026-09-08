import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const DEBUG_ID = '1234abcd-0000-4000-8000-0000deadbeef';
const SNIPPET =
  ';{try{let e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="' +
  DEBUG_ID +
  '",e._sentryDebugIdIdentifier="sentry-dbid-' +
  DEBUG_ID +
  '")}catch(e){}};\n//# debugId=' +
  DEBUG_ID +
  '\n';

mkdirSync('dist-control', { recursive: true });
writeFileSync('dist-control/index.js', readFileSync('dist/n10_cf/index.js', 'utf8') + '\n' + SNIPPET);
const map = JSON.parse(readFileSync('dist/n10_cf/index.js.map', 'utf8'));
map.debug_id = DEBUG_ID;
writeFileSync('dist-control/index.js.map', JSON.stringify(map));
const cfg = JSON.parse(readFileSync('dist/n10_cf/wrangler.json', 'utf8'));
cfg.name = 'n10_cf_control';
cfg.topLevelName = 'n10_cf_control';
cfg.vars.MARKER = 'cf-control';
writeFileSync('dist-control/wrangler.json', JSON.stringify(cfg));
console.log('wrote dist-control with debug id', DEBUG_ID);
