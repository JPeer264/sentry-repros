import * as Module from 'node:module';
Module.registerHooks({
  load(url, context, nextLoad) { return nextLoad(url, context); },
  resolve(spec, context, nextResolve) { return nextResolve(spec, context); },
});
