# verify4-M-fresh-deno-dbspans

## What it re-tests

Independent re-test of the capability **db spans** of cell `M-fresh-deno` (see `$REPRO/cells/M-fresh-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `build1.log`, `build2.log`, `build3.log`, `build4.log`, `build5.log`, `build6.log`, `buildB1.log`, `buildB2.log`, `buildB3.log`, `dev.pid`, `dev1.log`, `dev2.log`, `dev3.log`, `dev4.log`, `devB1.log`, `devB2.log`, `devB3.log`, `init.log`, `prod-final-static.log`, `prod-final-stream.log`, `prod.pid`, `prod1.log`, `prod2.log`, `prod3.log`, `prod4.log`, `prod5.log`, `prod6.log`, `prod7.log`, `prodB1.log`, `prodB2.log`, `prodB3.log`, `prodB4.log`, `sdkdeps/`, `sink-b.log`, `sink.log`, `sink.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. `mysql@2` db spans work on Fresh 2 / Deno 2.9.0 with @sentry/deno 10.67.0 (develop) in BOTH `vite dev` AND the production `deno task build` + `deno serve` shape, in both trace lifecycles. The report's "production build has no db span and the route 500s" is a vite-config problem, not an SDK or Fresh limitation.

THE EXACT CHANGE (vite.config.ts). The report used only `ssr: { external: ["mysql"] }`, which vite's build ignores because @fresh/plugin-vite sets `resolve.noExternal: true`. Adding a rollup external for the ssr *environment* does override it:

```ts
export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  ssr: { external: ["mysql"] },                      // needed for vite dev
  environments: {                                     // needed for the build
    ssr: { build: { rollupOptions: { external: ["mysql"] } } },
  },
});
```

I isolated both knobs:
- `ssr.external` only -> build bundles the driver: `_fresh-route___api_db-aH-ILX-r.mjs 518.83 kB` plus rollup warnings `"default" is not exported by "node_modules/mysql/lib/protocol/Auth.js"` (this is the shape that 500s at runtime). ($D/buildB2.log)
- `environments.ssr.build.rollupOptions.external` only -> build externalizes: `_fresh-route___api_db-CSs3YcfK.mjs 0.85 kB`, and the chunk's first line is literally `import mysql from "mysql";`. ($D/buildB3.log)
- `environments...` only, no `ssr.external` -> vite DEV breaks: `ReferenceError: exports is not defined` on /api/db. So both lines are load-bearing, one per shape.

PRODUCTION EVIDENCE (`deno task build && LIFECYCLE=static deno serve -A --port 38419 _fresh/server.js`, sink on 38417):
```
{"type":"transaction","name":"GET /api/db","op":"http.server","source":"route","status":"ok","trace_id":"e823d5e594324d61ad35a0be9365c323","sdk":"sentry.javascript.deno","spans":["db SELECT * FROM users"]}
{"type":"transaction","name":"GET /api/db","op":"http.server","source":"route","status":"ok","trace_id":"45e510e093b14d92a5b8cd568b2f4f2b","sdk":"sentry.javascript.deno","spans":["db SELECT * FROM users"]}
{"type":"transaction","name":"GET /api/sentinel","op":"http.server","source":"route","status":"ok","trace_id":"82f4be9bc5244c9cbee055a1c731073c","spans":[]}
```
Note both requests carry the db span, including the first one — the report's "first query becomes its own root transaction" caveat does NOT occur in the built server, because the route chunk (and with it the module-scope `createConnection`/`connect`) is lazily imported inside the first request.

PRODUCTION, stream lifecycle (`LIFECYCLE=stream`), correctly parented:
```
{"type":"span","trace_id":"8b08040879554589bb4d4f7dac42ee27","items":["db SELECT users","http.server GET /api/db"],"raw":[{"name":"SELECT users","status":"ok","parent_span_id":"91b9f3b0097e3dc7","is_segment":false,"origin":"auto.db.mysql"},{"name":"GET /api/db","status":"ok","is_segment":true,"origin":"auto.http.deno"}]}
```

VITE DEV EVIDENCE (`LIFECYCLE=static deno task dev --port 38418`), warm server:
```
transaction | GET /api/db | op=http.server | spans=["db SELECT * FROM users"]
transaction | GET /api/db | op=http.server | spans=["db SELECT * FROM users"]
transaction | GET /api/sentinel | op=http.server | spans=[]
```
The report's orphan-first-query caveat reproduces only when /api/db is the very first request the freshly started dev server ever handles: `transaction | SELECT * FROM users | op=db | source=custom | spans=[]` in its own trace, and that request's http.server transaction is missing entirely. Sending any other request first (I used /api/name-warm) makes every /api/db request nest correctly. It is a vite-dev first-request warmup artifact, not a db-instrumentation defect, and it does not exist in the build.

WHAT STILL DOES NOT WORK: `mysql2`. With the rollup external it is now correctly externalized (0.84 kB chunk), and it then hits Deno hook bug K3 in production exactly as reported — `SyntaxError: Unexpected token ':'` at `mysql2/lib/connection_config.js:13` (`require` of a .json file under `Module.registerHooks`), route 500s, error captured by the middleware. That is denoland/deno#36240 and hits every Deno framework, so it is not a Fresh gap. `mysql@2` is the driver to use on Deno.

No SDK change, no init/entry change and no lifecycle change was needed: `instrument.ts` (`import "@sentry/deno/import"` first, then `Sentry.init`) imported as the first line of `main.ts` is exactly the wiring the repo's own reference app uses (~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/deno-mysql/src/app.ts:5, with the same `nodeModulesDir: "manual"`). There is no Fresh e2e app in the repo.

Probe files (all under $SCRATCH/deep/verify4-M-fresh-deno-dbspans/): app/vite.config.ts (final config), app/instrument.ts, app/main.ts, app/db.ts, app/db2.ts, app/routes/api/{db,db2,sentinel}.ts; logs buildB1-B3.log (build variants), prodB2.log/prodB3.log/prodB4.log, devB1.log (no ssr.external), devB2.log/devB3.log. Rerun: start the sink `PORT=38417 node $REPRO/_toolbox/sink.mjs`, then in app/ `deno task build` and `LIFECYCLE=static deno serve -A --port 38419 _fresh/server.js`, curl /api/db then /api/sentinel, read `curl -s http://127.0.0.1:38417/__items`. All processes started were killed.

## Workaround

Add a rollup external for the ssr environment on top of `ssr.external`, because @fresh/plugin-vite sets `resolve.noExternal: true` (src/mod.ts:125) and a plain `ssr.external` / `resolve.external` does not override it at build time:

```ts
// vite.config.ts
export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  ssr: { external: ["mysql"] },
  environments: {
    ssr: { build: { rollupOptions: { external: ["mysql"] } } },
  },
});
```

`ssr.external` covers `vite dev`, the `environments.ssr.build.rollupOptions.external` entry covers `vite build`. With both, `mysql@2` stays a real `import mysql from "mysql"` in the emitted route chunk, Deno resolves it through the import map to `node_modules`, and the `@sentry/deno/import` hook instruments it in the built server exactly as in dev. Use `mysql@2`, not `mysql2` (the latter hits Deno's `require`-a-.json hook bug). If the dev server's very first request is a db route, the query surfaces as its own root transaction; hit any other route once after startup.

## Docs impact

On Deno with a Vite-based framework such as Fresh 2, database drivers must stay external in BOTH the dev SSR graph and the production bundle for the `@sentry/deno/import` hook to instrument them: set `ssr.external: ["mysql"]` for `vite dev` and, because `@fresh/plugin-vite` forces `resolve.noExternal: true`, also `environments.ssr.build.rollupOptions.external: ["mysql"]` for `vite build` — a bundled driver produces no db spans and fails at runtime.
