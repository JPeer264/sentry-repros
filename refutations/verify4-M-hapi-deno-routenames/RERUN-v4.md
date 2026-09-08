# verify4-M-hapi-deno-routenames — refutation pass (route names)

Tree state: node_modules is PRISTINE develop 10.67.0 (the earlier `loadSync` json patch was removed
before every run below; `grep -c 'endsWith(".json")' node_modules/@sentry/server-runtime-injection/build/*/vendored/@apm-js-collab/tracing-hooks/hook.js` == 0).

Ports: sink 41731, app 51837.
    PORT=41731 node $REPRO/_toolbox/sink.mjs > sink2.log 2>&1 &
    ./run.sh <main>.ts <static|stream> <tag> [extra deno flags]

## Runs (all on deno 2.9.0, unpatched SDK)

| tag | entry | result |
| --- | --- | --- |
| v4-control-unpatched      | main-plain.ts (hook, no json fix), static | app never boots, SyntaxError on @hapi/validate `require('../package.json')` |
| v4-flagimport-nojsonfix   | main-nohook.ts + `--import=./node_modules/@sentry/deno/build/import.mjs`, static | same crash — flag registration is not a way around it |
| v4-hookfix-static         | main-hookfix.ts (hook, then json-fix), static | `GET /users/{id}` source `route`, child `router GET /users/{id}`, `db SELECT * FROM users`, hapi error captured |
| v4-hookfix-stream         | main-hookfix.ts, stream | `http.server GET /users/{id}` + `router /users/{id}` |
| v4-fixfirst-static        | main-fixfirst.ts (json-fix BEFORE the sentry hook), static | identical to hookfix — hook order does NOT matter |
| v4-nohook-stream          | main-nohook.ts, stream | `http.server GET` (method only) |
| v4-manual-nohook-static   | main-manual-nohook.ts (no hook, no json fix, `server.ext('onPreHandler')` renaming the root span, source set via the string `'sentry.source'`) | `GET /users/{id}` but source `custom` |
| v4-manual2-nohook-static  | main-manual2-nohook.ts (same, but `Sentry.SENTRY_SEGMENT_NAME_SOURCE`), static | `GET /users/{id}` source `route` |
| v4-manual2-nohook-stream  | main-manual2-nohook.ts, stream | `http.server GET /users/{id}` |

## The hook-free route-name recipe (app-body-manual2.ts)

    server.ext('onPreHandler', (request, h) => {
      const active = Sentry.getActiveSpan();
      if (active) {
        const root = Sentry.getRootSpan(active);
        root.updateName(`${request.method.toUpperCase()} ${request.route.path}`);
        root.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, 'route');  // 'sentry.segment.name.source'
        root.setAttribute('http.route', request.route.path);
      }
      return h.continue;
    });

`updateName()` forces the segment name source to `custom`; the `SENTRY_SEGMENT_NAME_SOURCE`
attribute (exported from `@sentry/deno`) has to be set after it to get `route`. The plain
`'sentry.source'` attribute has no effect on develop.

## Notes

- Repo reference: `dev-packages/deno-integration-tests/suites/orchestrion-hapi/test.ts` never imports
  `@hapi/hapi`; it publishes `orchestrion:@hapi/hapi:route` on the diagnostics channel by hand, so CI
  never exercises importing hapi under the Deno load hook.
- `@sentry/deno/import` appears nowhere in ~/dev/sentry-docs.
