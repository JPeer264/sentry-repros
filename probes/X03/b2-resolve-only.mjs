import { createRequire, registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier, context);
  },
});

const require = createRequire(import.meta.url);

try {
  require('./req.cjs');
  console.log('RESULT b2-resolve-only: ok');
} catch (e) {
  console.log(`RESULT b2-resolve-only: FAIL ${e.name}: ${e.message}`);
}
