# verify4-M-hapi-deno-routenames

Deno 2.9.0, @hapi/hapi 21.4.x, @sentry/{deno,core,server-utils,server-runtime-injection,opentelemetry} 10.67.0
(tarballs from $S/pack), mysql@2 against MariaDB 127.0.0.1:3307. deno.json nodeModulesDir "manual".

Ports: sink 41731, app 51837.

    PORT=41731 node $S/qs/sink.mjs > sink.log 2>&1 &
    ./run.sh <main>.ts <static|stream> <tag> [extra deno flags]

run.sh clears the sink, starts the app, curls /users/42 /error /db /sentinel, waits for the
sentinel, prints the sink items, kills the app.

## Entries

- main-plain.ts             import "@sentry/deno/import" + init + app  (no JSON workaround)
- main-hookfix.ts           import hook, then ./json-fix.mjs, then init + app
- main-fixfirst.ts          ./json-fix.mjs FIRST, then import hook, then init + app
- main-hookfix-delegating.ts  json-fix-delegating.mjs (nextLoad + format:'json')
- main-nohook.ts            init + app only (no hook); also used with
                            --import=./node_modules/@sentry/deno/build/import.mjs

## SDK patch under test (currently APPLIED in node_modules)

node_modules/@sentry/server-runtime-injection/build/{esm,cjs}/vendored/@apm-js-collab/tracing-hooks/hook.js,
in `loadSync`, right after `const result = nextLoad(url, context);`:

    if (result && result.format === undefined && url.endsWith(".json")) { result.format = "json"; }

remove:  sed -i '' '/endsWith(".json")) { result.format = "json"; }/d' <file>
re-add:  sed -i '' 's|  const result = nextLoad(url, context);|  const result = nextLoad(url, context);\n  if (result \&\& result.format === undefined \&\& url.endsWith(".json")) { result.format = "json"; }|' <file>

## minrepro/

Framework-free repro of the Deno bug: node_modules/jsonpkg is a CJS package doing
require('./data.json'). `deno run main.ts` (passthrough load hook) crashes; main-resolveonly.ts
(resolve hook only) is fine; main-inspect2.ts shows nextLoad returns format === undefined for a
.json URL and that forcing format:'json' fixes it.
