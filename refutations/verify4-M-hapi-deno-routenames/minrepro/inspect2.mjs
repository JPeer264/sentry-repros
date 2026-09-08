import * as Module from 'node:module';
Module.registerHooks({
  load(url, context, nextLoad) {
    const r = nextLoad(url, context);
    if (url.endsWith('.json')) {
      console.log('HOOK json format=' + JSON.stringify(r.format) + ' keys=' + JSON.stringify(Object.keys(r)) + ' ctxFormat=' + JSON.stringify(context.format));
      return { ...r, format: 'json', shortCircuit: true };
    }
    return r;
  },
});
