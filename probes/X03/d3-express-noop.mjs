import { registerHooks } from 'node:module';

registerHooks({
  load(url, context, nextLoad) {
    return nextLoad(url, context);
  },
});

try {
  const m = await import('express');
  console.log(`RESULT d3-express-noop: ok typeof=${typeof (m.default ?? m)}`);
} catch (e) {
  console.log(`RESULT d3-express-noop: FAIL ${e.name}: ${e.message}`);
  console.log(e.stack);
}
