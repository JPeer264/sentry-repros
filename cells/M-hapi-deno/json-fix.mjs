// Workaround for denoland/deno#36240: as soon as any Module.registerHooks load hook
// is registered, Deno compiles require('*.json') through the CJS compiler and
// @hapi/validate/lib/common.js:6 dies with `SyntaxError: Unexpected token ':'`.
// Must be imported AFTER "@sentry/deno/import" so it sits first in the hook chain.
import * as Module from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

Module.registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.json')) {
      return { format: 'json', source: readFileSync(fileURLToPath(url), 'utf8'), shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
