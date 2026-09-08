const Module = require('node:module');
const fs = require('node:fs');
const { fileURLToPath } = require('node:url');
const mode = process.env.MODE || 'passthrough';

const resolveHook = (spec, ctx, next) => next(spec, ctx);

const loadPassthrough = (url, ctx, next) => next(url, ctx);
const loadJsonFormat = (url, ctx, next) => {
  const r = next(url, ctx);
  if (url.endsWith('.json')) { r.format = 'json'; }
  return r;
};
const loadJsonShort = (url, ctx, next) => {
  if (url.endsWith('.json')) {
    return { format: 'json', source: fs.readFileSync(fileURLToPath(url), 'utf8'), shortCircuit: true };
  }
  return next(url, ctx);
};
const loadJsonWrap = (url, ctx, next) => {
  if (url.endsWith('.json')) {
    const src = fs.readFileSync(fileURLToPath(url), 'utf8');
    return { format: 'commonjs', source: `module.exports = ${src}`, shortCircuit: true };
  }
  return next(url, ctx);
};

const opts = {};
if (mode !== 'load-only') opts.resolve = resolveHook;
if (mode === 'resolve-only') { /* no load */ }
else if (mode === 'json-format') opts.load = loadJsonFormat;
else if (mode === 'json-short') opts.load = loadJsonShort;
else if (mode === 'json-wrap') opts.load = loadJsonWrap;
else opts.load = loadPassthrough;

Module.registerHooks(opts);
try {
  console.log(mode, '-> json ok:', JSON.stringify(require('./data.json')));
} catch (e) {
  console.log(mode, '-> json FAILED:', e.constructor.name, e.message);
}
try {
  console.log(mode, '-> js ok:', require('./dep.cjs').v);
} catch (e) {
  console.log(mode, '-> js FAILED:', e.constructor.name, e.message);
}
