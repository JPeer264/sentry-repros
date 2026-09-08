import * as Module from 'node:module';
Module.registerHooks({
  load(url, context, nextLoad) {
    const r = nextLoad(url, context);
    if (url.endsWith('.json')) {
      console.log('HOOK json url=%s format=%j srcType=%s src=%j', url, r.format, typeof r.source, String(r.source).slice(0,40));
      return { ...r, format: 'json', shortCircuit: true };
    }
    return r;
  },
});
