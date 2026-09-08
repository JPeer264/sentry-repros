import * as Module from 'node:module';
Module.registerHooks({
  load(url, context, nextLoad) {
    const result = nextLoad(url, context);
    if (url.endsWith('.json')) {
      return { ...result, format: 'json', shortCircuit: true };
    }
    return result;
  },
});
