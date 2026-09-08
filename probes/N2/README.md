# N2 - `@sentry/cloudflare/nodejs_compat` entrypoint and `prismaIntegration`

## What it reproduces

Two claims about `@sentry/cloudflare` on the `develop` line (v11, package version 10.67.0), both on a
plain `wrangler dev` Worker with `nodejs_compat`. First, the documented `@sentry/cloudflare/nodejs_compat`
subpath entrypoint - the one every sample on the nodejs-compat feature page and on the Cloudflare Prisma
page imports from - no longer exists on `develop`: the package's `exports` map only has `.`, `./request`
and `./vite`, there is no `nodejs_compat` build artefact at all, and esbuild fails the bundle before the
Worker boots. Second, `prismaIntegration()` imported from the *main* entry does work: a `findMany()`
through `@prisma/client` 6.19.3 with the `@prisma/adapter-mariadb` driver adapter produces the full
Prisma span tree under the `http.server` transaction, with `sentry.op: "db"` set on the SQL spans and
`sentry.origin: "auto.db.prisma"`. A third, non-Sentry control shows why the app has to build the adapter
lazily: constructing `PrismaMariaDb` at module scope traps the Prisma wasm engine on workerd and every
query then dies on a connection-pool timeout.

## Install

```
cd $REPRO/probes/N2 && npm install && DATABASE_URL="mysql://root@127.0.0.1:3307/app" npx prisma generate
```

## Run

Needs the MariaDB from the toolbox on `127.0.0.1:3307` (user `root`, no password, database `app`,
table `users(id, name)`).

```
D=$REPRO/probes/N2
cd $D && PORT=45311 node sink.mjs > sink.log 2>&1 & sinkpid=$!

# step 1 - the nodejs_compat subpath entrypoint
cd $D && npx wrangler dev --config wrangler-n2-entrypoint.jsonc --port 41207 --inspector-port 0 > wrangler-n2-entrypoint.log 2>&1 & w=$!
curl -s -o /dev/null -w 'HTTP=%{http_code}\n' --max-time 10 http://127.0.0.1:41207/probe
cat $D/wrangler-n2-entrypoint.log
node -e 'console.log(JSON.stringify(Object.keys(require("'$D'/node_modules/@sentry/cloudflare/package.json").exports)))'
find $D/node_modules/@sentry/cloudflare/build -name '*nodejs_compat*'
kill $w; wait $w

# step 2 - prismaIntegration() from the main entry
curl -s -X DELETE http://127.0.0.1:45311/__items
cd $D && npx wrangler dev --config wrangler-n2-prisma.jsonc --port 57439 --inspector-port 0 > wrangler-n2-prisma.log 2>&1 & w=$!
curl -s http://127.0.0.1:57439/users
curl -s http://127.0.0.1:57439/sentinel      # sentinel: everything before it has arrived
curl -s http://127.0.0.1:45311/__items       # compact view
curl -s 'http://127.0.0.1:45311/__itemsraw'  # raw span attributes
kill $w; wait $w

# control - module-scope Prisma adapter, no Sentry in the Worker at all
cd $D && npx wrangler dev --config wrangler-n2-prisma-nosentry.jsonc --port 57431 --inspector-port 0 > wrangler-n2-prisma-nosentry.log 2>&1 & w=$!
curl -s --max-time 60 http://127.0.0.1:57431/users
kill $w; wait $w

kill $sinkpid; wait $sinkpid
```

## Expected

Recorded verdict: **partial**.

Step 1 BROKEN: `import * as Sentry from "@sentry/cloudflare/nodejs_compat"` does not build - the subpath
export was deleted on develop (exports are only `.`, `./request`, `./vite`, and there is no
`build/*/nodejs_compat/` directory at all). Every code sample on `features/nodejs-compat.mdx` and on the
Cloudflare `prisma.mdx` page therefore fails at bundle time on the very version the nodejs-compat page
names as its future default (v11). Step 2 WORKS via the main entry: `prismaIntegration()` imported from
`@sentry/cloudflare` produces a full Prisma span tree, and develop sets `sentry.op: "db"` on the SQL
spans (10.73.0 leaves op unset). Separate non-Sentry finding: creating the `PrismaMariaDb` adapter at
module scope hangs workerd (pool timeout after 10001ms, plus an `Uncaught RuntimeError: unreachable`
wasm trap); the adapter must be constructed inside the request handler.

Recorded evidence lines:

```
wrangler dev, develop, src/n2-entrypoint.ts:
  X [ERROR] Build failed with 1 error:
    X [ERROR] Could not resolve "@sentry/cloudflare/nodejs_compat"
        src/n2-entrypoint.ts:1:24:
          1 | import * as Sentry from "@sentry/cloudflare/nodejs_compat";
      The path "./nodejs_compat" is not exported by package "@sentry/cloudflare":
        node_modules/@sentry/cloudflare/package.json:18:13
  curl http://127.0.0.1:41207/probe -> HTTP=000 (worker never boots)

exports map, develop pack @sentry/cloudflare 10.67.0:
  ["./package.json",".","./request","./vite"]

Sink (compact) after GET /users + sentinel, integrations:[Sentry.prismaIntegration()]:
{
 "type": "transaction", "name": "GET /users", "op": "http.server", "source": "url", "status": "ok",
 "spans": [
  "undefined prisma:client:load_engine",
  "undefined prisma:client:operation",
  "undefined prisma:client:serialize",
  "undefined prisma:client:connect",
  "undefined prisma:engine:connect",
  "db prisma:engine:connection",
  "undefined prisma:engine:query",
  "db prisma:engine:connection",
  "db SELECT `users`.`id`, `users`.`name` FROM `users` WHERE 1=1",
  "undefined prisma:engine:js:query:args",
  "db prisma:engine:js:query:sql",
  "undefined prisma:engine:js:query:result",
  "undefined prisma:engine:serialize",
  "undefined prisma:engine:response_json_serialization"
 ]
}
{"type":"event","message":"n2-prisma-sentinel","sdk":"sentry.javascript.cloudflare","runtime":{"name":"cloudflare"}}

Raw span shape (op / description / data):
{"desc":"prisma:client:operation","attrs":{"sentry.origin":"auto.db.prisma","method":"findMany","model":"users","name":"users.findMany"}}
{"op":"db","desc":"SELECT `users`.`id`, `users`.`name` FROM `users` WHERE 1=1","attrs":{"sentry.origin":"auto.db.prisma","sentry.op":"db","db.query.text":"SELECT `users`.`id`, `users`.`name` FROM `users` WHERE 1=1","db.system":"mysql","sentry.kind":"client"}}
{"op":"db","desc":"prisma:engine:js:query:sql","attrs":{"sentry.origin":"auto.db.prisma","sentry.op":"db","db.system":"mysql","db.query.text":"SELECT ...","sentry.kind":"client"}}
{"desc":"prisma:engine:js:query:result","attrs":{"sentry.origin":"auto.db.prisma","db.response.returned_rows":2,"sentry.kind":"client"}}

Module-scope adapter failure (prisma only, no Sentry):
  X [ERROR] Uncaught RuntimeError: unreachable
        at wasm://wasm/008a260a:wasm-function[647]:0x13cd18
  {"ok":false,"error":"PrismaClientUnknownRequestError: Invalid `prisma.users.findMany()` invocation: Error occurred during query execution: ConnectorError(... MysqlError { code: 45028, message: \"pool timeout: failed to retrieve a connect...
```

## Observed on 2026-09-07

Step 1, `wrangler-n2-entrypoint.log` and the exports map (`run-entrypoint.txt`):

```
✘ [ERROR] Build failed with 1 error:

  ✘ [ERROR] Could not resolve "@sentry/cloudflare/nodejs_compat"

      src/n2-entrypoint.ts:1:24:
        1 │ import * as Sentry from '@sentry/cloudflare/nodejs_compat';
          ╵                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    The path "./nodejs_compat" is not exported by package "@sentry/cloudflare":

      node_modules/@sentry/cloudflare/package.json:18:13:
        18 │   "exports": {
           ╵              ^

$ curl -s -o /dev/null -w "HTTP=%{http_code}" http://127.0.0.1:41207/probe
HTTP=000

$ node -e exports map of @sentry/cloudflare
["./package.json",".","./request","./vite"]
$ ls node_modules/@sentry/cloudflare/build
cjs
esm
types
$ find node_modules/@sentry/cloudflare/build -name "*nodejs_compat*"
(no output = no nodejs_compat build artefact)
$ grep -n "prismaIntegration" node_modules/@sentry/cloudflare/build/types/index.d.ts
14:export { otlpIntegration, getOtlpTracesEndpoint, prismaIntegration, instrumentOpenAiClient, ... } from '@sentry/server-utils';
```

Step 2, `GET /users` returned `{"ok":true,"rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}` and the
sink held (`run-prisma-sink.txt`):

```
{
 "type": "transaction",
 "name": "GET /users",
 "op": "http.server",
 "source": "url",
 "status": "ok",
 "spans": [
  "prisma:client:load_engine",
  "prisma:client:operation",
  "prisma:client:serialize",
  "prisma:client:connect",
  "prisma:engine:connect",
  "db prisma:engine:connection",
  "prisma:engine:query",
  "db prisma:engine:connection",
  "db SELECT `users`.`id`, `users`.`name` FROM `users` WHERE 1=1",
  "prisma:engine:js:query:args",
  "db prisma:engine:js:query:sql",
  "prisma:engine:js:query:result",
  "prisma:engine:serialize",
  "prisma:engine:response_json_serialization"
 ]
}
{"type":"event","message":"n2-prisma-sentinel","sdk":"sentry.javascript.cloudflare","runtime":{"name":"cloudflare"}}
```

Raw span attributes (`run-prisma-raw-spans.txt`):

```
{"desc":"prisma:client:operation","attrs":{"sentry.origin":"auto.db.prisma","method":"findMany","model":"users","name":"users.findMany"}}
{"op":"db","desc":"SELECT `users`.`id`, `users`.`name` FROM `users` WHERE 1=1","attrs":{"sentry.origin":"auto.db.prisma","sentry.op":"db","db.system":"mysql","db.query.text":"SELECT `users`.`id`, `users`.`name` FROM `users` WHERE 1=1","sentry.kind":"client"}}
{"op":"db","desc":"prisma:engine:js:query:sql","attrs":{"sentry.origin":"auto.db.prisma","sentry.op":"db","db.system":"mysql","db.query.text":"SELECT `users`.`id`, `users`.`name` FROM `users` WHERE 1=1","sentry.kind":"client"}}
{"desc":"prisma:engine:js:query:result","attrs":{"sentry.origin":"auto.db.prisma","db.response.returned_rows":2,"sentry.kind":"client"}}
```

Control, module-scope adapter without Sentry (`run-prisma-nosentry.txt`):

```
{"ok":false,"error":"PrismaClientUnknownRequestError: \nInvalid `prisma.users.findMany()` invocation:\n\n\nError occurred during query execution:\nConnectorError(ConnectorError { user_facing_error: None, kind: QueryError(Server(MysqlError { code: 45028, message: \"pool timeout: failed to retrieve a connection from pool after 10002ms\\n    (pool connections: active=0 idle=0 limit=2)\", state: \"HY000\" })), transient: false })"}

✘ [ERROR] Uncaught RuntimeError: unreachable

      at wasm://wasm/008a260a:wasm-function[647]:0x13cd18
      at wasm://wasm/008a260a:wasm-function[182]:0xa07f7
```

Matches the recorded verdict: **yes**. Both steps behave exactly as recorded, and the control fails with
the same wasm trap at the same function offset and the same pool deadline (10002ms here, 10001ms in
the record). Two presentational differences, neither behavioural: the toolbox sink used here trims the
empty `op` instead of printing `undefined <name>`, so the span list reads `prisma:client:operation` where the record reads
`undefined prisma:client:operation`; and the DB rows are the toolbox MariaDB's `ada`/`linus` on port
3307 rather than the `alice`/`bob` on 43307 the record's own note 1 had to start by hand (the toolbox
container was running this time).

## Files

- `src/n2-entrypoint.ts` - Worker importing `@sentry/cloudflare/nodejs_compat`; never builds
- `src/n2-prisma.ts` - Worker with `prismaIntegration()` from the main entry, adapter built lazily inside the handler
- `src/n2-prisma-nosentry.ts` - the same query with the adapter at module scope and no Sentry
- `prisma/schema.prisma` - `users(id, name)` on the mysql provider with `driverAdapters`
- `wrangler-n2-*.jsonc` - `compatibility_date: 2026-05-01`, `nodejs_compat`, DB and sink ports as vars
- `sink.mjs` - the toolbox envelope sink, unmodified
- `run-entrypoint.txt`, `run-prisma-sink.txt`, `run-prisma-raw-spans.txt`, `run-prisma-nosentry.txt` - captured output
- `wrangler-n2-*.log`, `sink.log` - raw server logs from the run
