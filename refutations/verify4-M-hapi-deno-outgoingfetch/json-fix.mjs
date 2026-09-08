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
