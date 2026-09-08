# Index

Every entry is a directory with a README (Install, Run, Expected, Observed). Rebuilt on 2026-09-07 from the recorded results; `matches` says whether the rebuilt run reproduced the recorded verdict.

## Probes

| Probe | Title | Recorded | Rebuilt | Matches | Difference |
| --- | --- | --- | --- | --- | --- |
| [B01](probes/B01/) | B01. Process-level errors in a Bun script | see record | yes | yes | No behavioural difference. All seven cases match the recorded verdict exactly: mechanism, level, handled, extra.unhandle |
| [B02](probes/B02/) | Enrichment on Bun events | works | yes | yes | No behavioral difference: every recorded field matched, including frame positions 22:3 and 18:13 and the synthetic senti |
| [B03](probes/B03/) | Request isolation under concurrency on Bun.serve | works | yes | yes | None that changes the verdict. Three incidental deviations: (1) the sixth http.server span in this run is the /ping read |
| [B04](probes/B04/) | Incoming trace continuation on Bun.serve and node:http | works | yes | yes | None behavioural: both Bun.serve and node:http continue the incoming trace (trace_id = supplied id, parent_span_id = sup |
| [B05](probes/B05/) | Release health sessions on Bun | partial | yes | yes | None in substance; all three cases reproduce the recorded verdict (no `sessions` aggregate ever for Bun.serve plus an im |
| [B06](probes/B06/) | Metrics on Bun | works | yes | yes | Nothing in the behavior differs: the Bun 1.4.0 output matches the recorded app.log evidence byte for byte, verdict "work |
| [B07](probes/B07/) | Logs on Bun: Sentry.logger and consoleLoggingIntegration | works | yes | yes | Only one cosmetic difference: in probe-a the third log item carried sentry.timestamp.sequence 0 instead of the recorded  |
| [B08](probes/B08/) | Short-lived Bun script: delivery without flush | partial | yes | yes | Two differences, neither changes the verdict. (1) The Bun 1.3.14 CI pin is gone from the scratchpad ($S/bun1314/bun-darw |
| [B09](probes/B09/) | Request body capture on Bun.serve | broken | yes | yes | None that changes the verdict; the recorded "broken" reproduces exactly, including the d.ts line numbers (bunserver.d.ts |
| [B10](probes/B10/) | Streaming responses on Bun.serve | broken | yes | yes | Environmental only: the CI-pinned Bun 1.3.14 binary the record used ($S/bun1314/bun-darwin-aarch64/bun) no longer exists |
| [B11](probes/B11/) | Single-file executable (bun build --compile) with the Sentry plugin | works | yes | yes | One deviation, in the baseline (no-plugin) variant only. The record says the baseline binary captured no "express boom"  |
| [B12](probes/B12/) | bun --watch and --hot dev modes | partial | yes | yes | None in behavior: every recorded claim reproduced exactly (watch clean, hot duplicates root spans 2x then 3x in distinct |
| [B13](probes/B13/) | Elysia on Bun with @sentry/elysia | partial | yes | yes | None material. Cosmetic only: fresh trace ids and different ports, and the baggage in this run has no sentry-org_id (the |
| [B14](probes/B14/) | NestJS on Bun via the plugin build | partial | yes | yes | No behavioral difference: all three recorded claims reproduced on Bun 1.4.0 with @nestjs/* 12.0.1 and the develop tarbal |
| [B16](probes/B16/) | Bun native APIs: Bun.sql, bun:sqlite, Bun.redis | works | yes | yes | None behaviourally: all four transactions carry "spans":[] in both legs, the three Bun native APIs return their data, th |
| [B17](probes/B17/) | mysql2 driver on Bun with the plugin build | works | yes | yes | None of substance. Only fresh span/segment ids, and the sink port is 52847 instead of the recorded 47311 (47311 was alre |
| [B18](probes/B18/) | node:http server on Bun (no framework) | partial | yes | yes | No behavioral difference; the recorded "partial" verdict reproduces in all four variants (stream spans per request with  |
| [B19](probes/B19/) | OpenAI SDK on Bun via the plugin build (mock server) | works | yes | yes | None material. Cosmetic only: fresh ports (mock server on 51872 instead of the recorded 47312), a fresh gen_ai span id,  |
| [C01](probes/C01/) | Handler errors and enrichment on Workers | partial | yes | yes | None that changes the verdict. Cosmetic only: ports 44871/44872 instead of the recorded 41871/41872; file paths point at |
| [C02](probes/C02/) | Request isolation under concurrency on Workers | see record | yes | yes | None on the develop line: both variants returned the recorded verdict object byte for byte, and the recorded side observ |
| [C03](probes/C03/) | Incoming trace continuation on Workers | works | yes | yes | None that affects the verdict. Every assertion in the record reproduced: the http.server segment keeps trace_id aaaaaaaa |
| [C04](probes/C04/) | Scheduled handler and cron monitors on Workers | works | yes | yes | None behavioural; the recorded verdict "works" reproduced in full. Only per-run values and cosmetics differ: ids, timest |
| [C05](probes/C05/) | Queues producer and consumer locally | works | yes | yes | None behavioral. Every recorded element reproduced: `queue.publish` spans named `send Q` (binding key, not queue name) a |
| [C06](probes/C06/) | D1 locally | works | yes | yes | None that bears on the verdict. The only numeric drift is in the data-dependent D1 meta counters: cloudflare.d1.rows_rea |
| [C07](probes/C07/) | R2 and KV locally | works | yes | yes | No behavioral difference: R2 put/get/head/list/delete each produced their recorded span (ops object.put/get/head/list/de |
| [C08](probes/C08/) | Durable Objects locally | works | yes | yes | None that changes the verdict. Every recorded relationship holds: DO fetch span parented on the worker request span in t |
| [C09](probes/C09/) | wrapRequestHandler without nodejs_compat | partial | yes | partial | One sub-detail of the ALS control variant differs. The record says the ALS variant delivers the sentinel event in the ba |
| [C10](probes/C10/) | Cloudflare Pages with sentryPagesPlugin | partial | yes | yes | None behavioural. Every recorded element reproduced on the first run: plugin boots, unhandled auto.http.cloudflare event |
| [C11](probes/C11/) | Configuration from env on Workers | works | yes | yes | No behavioral difference; the recorded verdict "works" reproduces on all three runs. Cosmetic only: ports are 45311 (sin |
| [C12](probes/C12/) | Sessions, metrics and logs on Workers | partial | yes | yes | Substance identical: metrics and logs arrive as trace_metric and log envelopes drained at the end of the producing reque |
| [C13](probes/C13/) | Request body capture on Workers | works | yes | yes | None behavioural. Every recorded evidence line reproduced verbatim, on the same ports, including the httpServer.d.ts:18  |
| [C14](probes/C14/) | Streaming responses and work after the response on Workers | works | yes | yes | None that changes the verdict. Cosmetic only: ports 47141 (sink) / 47142 (app) instead of the recorded 41477/41478; this |
| [C15](probes/C15/) | Hono on Workers with @sentry/hono/cloudflare | works | yes | yes | No behavioural difference; the recorded verdict "works" reproduced element for element (route-named http.server span env |
| [C16](probes/C16/) | OpenAI SDK on Workers via the Vite plugin (mock server) | works | yes | yes | No behavioral difference: verdict "works" reproduces in all three variants, with every recorded gen_ai.* attribute prese |
| [C18](probes/C18/) | Astro on Cloudflare Workers | see record | yes | yes | All three recorded evidence lines reproduce with the recorded values, so the verdict "works" holds. Deviations, none of  |
| [C25](probes/C25/) | WorkerEntrypoint RPC via a self service binding | works | yes | yes | Nothing that contradicts the record. The recorded verdict "works" reproduced on the first run: `rpc hello` span parented |
| [C26](probes/C26/) | Workflows locally | partial | yes | yes | None behaviorally. The recorded verdict "partial" holds in every part: `function` segment spans per `step.do` with code. |
| [D01](probes/D01/) | Process-level errors in a Deno script | works | yes | yes | No behavioral difference. Every recorded field reproduced: level=fatal, handled=false, mechanism auto.deno.global_handle |
| [D02](probes/D02/) | Enrichment on Deno events | partial | yes | yes | Only the file path in the crash stack frame. The record ran against worktree symlinks, so Deno's source-mapped frame rea |
| [D03](probes/D03/) | Request isolation under concurrency on Deno.serve | works | yes | yes | None that changes the verdict. Every recorded assertion held on the first run for both servers (boomEvents=5, allTagsOwn |
| [D04](probes/D04/) | Incoming trace continuation on Deno.serve and node:http | partial | yes | yes | None material. The recorded verdict "partial" reproduces exactly on develop (@sentry/deno 10.67.0 from _toolbox/pack, De |
| [D05](probes/D05/) | Release health sessions on Deno | partial | yes | yes | None material. Only incidentals differ from the recorded evidence: the aggregate `started` minute buckets are today's (2 |
| [D06](probes/D06/) | Metrics on Deno | works | yes | yes | None that affects the verdict. Two cosmetic deltas from the recorded lines: sentry.timestamp.sequence values are 0,1,2,3 |
| [D07](probes/D07/) | Logs on Deno: Sentry.logger and consoleLoggingIntegration | works | yes | yes | Only the `sentry.timestamp.sequence` tie-breaker differs: the recorded logger envelope shows the `info line` item at seq |
| [D08](probes/D08/) | Short-lived Deno script: delivery without flush | partial | yes | yes | No behavioral difference: all three recorded outcomes reproduce on deno 2.9.0 (natural exit delivers without flush; thre |
| [D09](probes/D09/) | Request body capture on Deno.serve | works | yes | yes | None in behavior. Five stale result files from a mis-run first attempt (env vars quoted into the label) remain in the di |
| [D10](probes/D10/) | Streaming responses on Deno.serve | partial | yes | yes | None substantive. The content-type heuristic (text/plain and text/event-stream get a full-length span, application/octet |
| [D11](probes/D11/) | Deno.cron check-ins | partial | yes | yes | None that changes the recorded verdict (partial). Three cosmetic/procedural differences: (1) the record installed the SD |
| [D12](probes/D12/) | Oak framework on Deno | partial | yes | yes | None substantive; the recorded verdict "partial" reproduces in all seven runs on the first attempt. Request spans appear |
| [D13](probes/D13/) | Hono on Deno with the hook and a database | works | yes | yes | None behavioral. Two cosmetic deltas against the recorded excerpt: (1) this run's sink prints exception/runtime/trace_id |
| [D14](probes/D14/) | node:http server on Deno (no framework) | partial | yes | yes | None substantive. Every recorded claim reproduced on the first run: http.server segment spans named "GET" with sentry.se |
| [D15](probes/D15/) | mysql2 driver on Deno with the hook | broken | yes | yes | None that affect the verdict "broken". Deviations: (1) Deno 2.8.3 was not re-tested, the CI-pin binary the record used ( |
| [D16](probes/D16/) | deno compile binary with the hook | see record | yes | yes | None on the verdict. The run script needed exec in its subshell so the baseline server is killed before the binary start |
| [D17](probes/D17/) | OpenAI SDK on Deno via the hook (mock server) | broken | yes | yes | None that changes the verdict. Three cosmetic deltas from the recorded evidence: (1) the record lists two `http.server G |
| [D18](probes/D18/) | Deno hook with nodeModulesDir variants | partial | yes | yes | Verdict matches (partial): no nodeModulesDir -> mysql resolves from Deno's global npm cache, runtime stays [], no db spa |
| [N1](probes/N1/) | Deno with only the permissions the docs prescribe | partial | yes | yes | None affecting the verdict. The recorded flag-by-flag table reproduced row for row: server_name and contexts.os.version  |
| [N10](probes/N10/) | Debug IDs and source maps, verified without a Sentry account | partial | yes | yes | None that change the verdict; the recorded "partial" holds in every part, including the positive control and the source  |
| [N2](probes/N2/) | @sentry/cloudflare/nodejs_compat entrypoint and prismaIntegration | partial | yes | yes | None behavioural. Step 1 fails to bundle with the identical esbuild error and the same exports map ["./package.json","." |
| [N3](probes/N3/) | Cloudflare Vite plugin: autoInstrumentation, option names and defaults | broken | yes | yes | No behavioral difference; the recorded verdict (broken) reproduces in full, including both extra gaps. Cosmetic differen |
| [N4](probes/N4/) | Cloudflare Agents SDK: instrumentAgentWithSentry, callable spans and conversation IDs | partial | yes | yes | Two deltas, neither touching the verdict (both already written into the README's "Observed on 2026-09-07" section). 1) T |
| [N5](probes/N5/) | Durable Object websockets, alarms and storage key filtering | works | yes | yes | None behavioral. Every recorded claim reproduced: one `websocket webSocketMessage` span per message across both hibernat |
| [N6](probes/N6/) | The optional integrations the docs list for all three runtimes | works | yes | yes | None behavioural. Every recorded claim held: exactly 4 events reached the sink with `nested boom` present once (dedupe d |
| [N7](probes/N7/) | Bun with an existing OpenTelemetry setup (skipOpenTelemetrySetup) | broken | yes | yes | None that touches the verdict. Incidental: bun here is 1.4.2 (record ran 1.4.0), so the boot error prints "Bun v1.4.2";  |
| [N8](probes/N8/) | deno serve entry shape, including --parallel | works | yes | yes | Dedupe did not fire in the rebuild. The record has event: 12 single-worker (3 identical /boom throws collapsed to 1, 6 i |
| [N9](probes/N9/) | Fresh 2 on Deno | partial | yes | yes | None that affects the verdict; the partial verdict reproduced in full (Fresh 2.3.3 boots with and without the hook, rout |
| [X01](probes/X01/) | Hono on Bun bundled: hono inlined vs external (K7) | partial | yes | yes | No behavioural difference; verdict partial reproduced exactly in all three modes. Environment/cosmetic deltas: Bun is 1. |
| [X02](probes/X02/) | K11 independent re-verification (lazy module load under Bun) | broken | yes | yes | None that changes the verdict. Every recorded line reproduced: modscope and lazy-keep give "spans":["db SELECT id, name  |
| [X03](probes/X03/) | K3 independent re-verification (JSON require under a load hook) | broken | yes | yes | None that touches the finding. All sixteen scripts land on the recorded results on both deno 2.9.0 and deno 2.8.3, inclu |

## Framework cells

| Cell | Framework on runtime | | Rebuilt | Matches | Difference |
| --- | --- | --- | --- | --- | --- |
| [M-astro-bun](cells/M-astro-bun/) | Astro 7.3.1 with @astrojs/node 10.x standalone adapter, @sentry/astro 10.67.0 (develop, 6f |  | yes | yes | All seven bun capability verdicts reproduce exactly. One difference, and it sits in the node control leg rather than in  |
| [M-astro-cf](cells/M-astro-cf/) | Astro 7.3.1 with @astrojs/cloudflare 14.3.0 on Cloudflare Workers (wrangler 4.129, workerd |  | yes | yes | No verdict differs; all seven server capabilities reproduce and client errors stays not-run. Two cosmetic deltas in the  |
| [M-astro-deno](cells/M-astro-deno/) | Astro 7.3.1 (SSR, `output: 'server'`) with `@deno/astro-adapter` 0.6.0 and `@sentry/astro` |  | yes | yes | None in behavior: all seven capability verdicts reproduce, including the broken outgoing fetch. Build noise matches too  |
| [M-elysia-bun](cells/M-elysia-bun/) | Elysia 1.4 (@sentry/elysia 10.67.0, develop / v11 line) on bun 1.4.0 |  | yes | yes | Only one, environmental: this machine now runs bun 1.4.2, not the recorded 1.4.0, so every event's contexts.runtime.vers |
| [M-elysia-cf](cells/M-elysia-cf/) | M-elysia-cf on  |  | present |  |  |
| [M-elysia-deno](cells/M-elysia-deno/) | M-elysia-deno on  |  | present |  |  |
| [M-express-bun](cells/M-express-bun/) | Express 4.22.1 on Bun 1.4.0 |  | yes | yes | All seven capability verdicts match the record, in both stream and static lifecycles, and the un-bundled contrast reprod |
| [M-express-cf](cells/M-express-cf/) | M-express-cf on  |  | present |  |  |
| [M-express-deno](cells/M-express-deno/) | Express 5.2.1 (router 2.x) on Deno 2.9.0 |  | yes | yes | No behavioral difference: all seven recorded verdicts reproduced exactly, as did the hook-only SyntaxError crash and the |
| [M-fastify-bun](cells/M-fastify-bun/) | Fastify 5.7.1 on Bun 1.4.0 (@sentry/bun 10.67.0, develop @ 6f2da7483d) |  | yes | yes | None on behavior: all seven capability verdicts reproduce exactly, including db spans being absent on plain `bun run` an |
| [M-fastify-cf](cells/M-fastify-cf/) | M-fastify-cf on  |  | present |  |  |
| [M-fastify-deno](cells/M-fastify-deno/) | Fastify 5.12.3 on Deno 2.9.0 (`deno` on PATH), @sentry/deno 10.67.0 from develop (6f2da748 |  | yes | yes | No behavioral difference. All seven recorded verdicts reproduced (six works, outgoing fetch broken), plus the recorded K |
| [M-fresh-bun](cells/M-fresh-bun/) | M-fresh-bun on  |  | present |  |  |
| [M-fresh-cf](cells/M-fresh-cf/) | M-fresh-cf on  |  | present |  |  |
| [M-fresh-deno](cells/M-fresh-deno/) | Fresh 2 (@fresh/core 2.3.3, @fresh/plugin-vite 1.1.2, scaffolded with jsr:@fresh/init@2.3. |  | yes | yes | No verdict differs; all seven capabilities reproduced in all four shapes (vite dev static/stream, both NO_SENTRY_MW base |
| [M-hapi-bun](cells/M-hapi-bun/) | @hapi/hapi 21.3.10 on Bun 1.4.0 (@sentry/bun 10.67.0, develop @ 6f2da7483d) |  | yes | yes | None that affects a capability. One cosmetic difference: the outgoing baggage header has no `sentry-org_id` member (reco |
| [M-hapi-cf](cells/M-hapi-cf/) | M-hapi-cf on  |  | present |  |  |
| [M-hapi-deno](cells/M-hapi-deno/) | @hapi/hapi 21.4.x on Deno 2.9.0 (deno.json nodeModulesDir: "manual", npm node_modules on d |  | yes | yes | None of substance. All seven capabilities reproduced with the recorded verdicts, and variant B crashed at import with th |
| [M-hono-bun](cells/M-hono-bun/) | Hono 4.10.x (`hono@4`) with `@sentry/hono/bun` 10.67.0 (develop, v11 line) on Bun 1.4.0 (` |  | yes | yes | No verdict differs; all seven server capabilities reproduce and client errors stays not-run for the same reason. Only en |
| [M-hono-cf](cells/M-hono-cf/) | Hono 4 (@sentry/hono/cloudflare middleware, SDK 10.67.0 from develop) on Cloudflare Worker |  | yes | yes | No behavioral difference; all seven runnable capabilities reproduce with the recorded verdicts, and client errors stays  |
| [M-hono-deno](cells/M-hono-deno/) | Hono 4.13.7 (`@sentry/hono/deno` 10.67.0, develop) on Deno 2.9.0 |  | yes | yes | None on any capability verdict. Two immaterial deltas: (1) the record shows the log envelope arriving about 8s after the |
| [M-koa-bun](cells/M-koa-bun/) | Koa 2.16.4 + @koa/router 12.0.2 on bun 1.4.0 (macOS arm64) |  | yes | yes | No verdict differs; all seven capabilities reproduce as recorded, and the unbundled control reproduces the recorded note |
| [M-koa-cf](cells/M-koa-cf/) | M-koa-cf on  |  | present |  |  |
| [M-koa-deno](cells/M-koa-deno/) | Koa 3.2.1 + @koa/router 15.7.0 on Deno 2.9.0 (aarch64-apple-darwin), @sentry/deno 10.67.0  |  | yes | yes | No verdict changed; all seven capabilities and the import-hook crash reproduced. Four cosmetic deltas: (1) ports are 419 |
| [M-nestjs-bun](cells/M-nestjs-bun/) | NestJS 11 (@nestjs/core + @nestjs/platform-express) with @sentry/nestjs + @sentry/bun on b |  | yes | yes | None material; all eight capability verdicts reproduce. Two cosmetic deltas: (1) the recorded baggage line carries sentr |
| [M-nestjs-cf](cells/M-nestjs-cf/) | M-nestjs-cf on  |  | present |  |  |
| [M-nestjs-deno](cells/M-nestjs-deno/) | NestJS 10 (@nestjs/core + @nestjs/platform-express) with @sentry/nestjs 10.67.0 (develop / |  | yes | yes | No verdict differs; all seven applicable capabilities match the record and client errors stays not-run. Cosmetic differe |
| [M-nextjs-bun](cells/M-nextjs-bun/) | Next.js 15.5.4 (app router) with @sentry/nextjs 10.67.0 (develop, v11 line) on bun 1.4.0,  |  | yes | partial | Six of eight capability verdicts reproduce exactly (errors, isolation, incoming trace, outgoing fetch, logs, client erro |
| [M-nextjs-cf](cells/M-nextjs-cf/) | Next.js 15.5.25 (App Router) via @opennextjs/cloudflare 1.20.6, @sentry/nextjs 10.67.0 (de |  | yes | yes | No verdict differs. Setup deltas the record omits: package.json build script must be `next build` (the recovered partial |
| [M-nextjs-deno](cells/M-nextjs-deno/) | Next.js 15.5.4 (App Router, route handlers) on Deno 2.9.0 (aarch64-apple-darwin), `deno ru |  | yes | yes | No behavioral difference from the record; all eight verdicts and the crash reproduce. Only cosmetic/environment drift: ( |
| [M-nuxt-bun](cells/M-nuxt-bun/) | Nuxt 4.5.2 (Nitro 2.13.4, h3 v1) + @sentry/nuxt 10.67.0 (develop, worktree 6f2da7483d) on  |  | yes | partial | Six of seven capabilities reproduce exactly (errors, route names, isolation, incoming trace, outgoing fetch, logs, inclu |
| [M-nuxt-cf](cells/M-nuxt-cf/) | Nuxt 4.2.x (nitro `cloudflare_module` preset, h3 v1, server routes under `server/api/`) on |  | yes | yes | No behavioral difference: all seven capabilities reproduced with the recorded verdicts, including the "partial" on route |
| [M-nuxt-deno](cells/M-nuxt-deno/) | Nuxt 4.5.2 (nitro 2.13.4 / h3 1.15.11) with @sentry/nuxt 10.67.0 (develop, 6f2da7483d) on  |  | yes | yes | None on any of the seven capabilities: all match the recorded verdict, and the recorded install bug (`.output/server/den |
| [M-oak-bun](cells/M-oak-bun/) | M-oak-bun on  |  | present |  |  |
| [M-oak-cf](cells/M-oak-cf/) | M-oak-cf on  |  | present |  |  |
| [M-oak-deno](cells/M-oak-deno/) | Oak 17.2.0 (jsr:@oak/oak) on Deno 2.9.0 (aarch64-apple-darwin), @sentry/deno develop (10.6 |  | yes | yes | No behavioral difference: all eight capability verdicts and the app.listen() contrast reproduced as recorded. Two incide |
| [M-reactrouter-bun](cells/M-reactrouter-bun/) | React Router 8 (framework mode, custom Express/Node server) with @sentry/react-router 10.6 |  | yes | yes | No verdict differs; all seven server capabilities reproduced exactly (errors works, logs works, route names / isolation  |
| [M-reactrouter-cf](cells/M-reactrouter-cf/) | React Router 7.18.3 (framework mode, SSR) with @react-router/dev 7.18.3, vite 7.3.6, @clou |  | yes | yes | No substantive difference: all seven server capabilities reproduce as "works" and client errors stays "not-run", matchin |
| [M-reactrouter-deno](cells/M-reactrouter-deno/) | React Router v7.18.3 (framework mode, SSR) on deno 2.9.0 |  | yes | yes | No verdict differs. Three incidental differences. (1) The record's db-spans detail is truncated in cells.json and names  |
| [M-remix-bun](cells/M-remix-bun/) | Remix v2 (@remix-run/dev 2.17.x vite plugin + @remix-run/express adapter), @sentry/remix 1 |  | yes | partial | Only the "outgoing fetch" capability differs. The record says plain `bun server.mjs` puts `sentry-trace`/`baggage` on th |
| [M-remix-cf](cells/M-remix-cf/) | Remix v2 (2.17.5, Remix Vite plugin, resource routes) on Cloudflare Workers (wrangler 4.12 |  | yes | yes | None of substance; all seven capability verdicts reproduce, including both negative controls (isolation without setAsync |
| [M-remix-deno](cells/M-remix-deno/) | M-remix-deno on  |  | present |  |  |
| [M-solidstart-bun](cells/M-solidstart-bun/) | SolidStart 2 (@solidjs/start 2.0.2 + nitro 3.0.260610-beta + vite 8) on bun 1.4.0 (running |  | yes | yes | Three immaterial differences, none changing a verdict. (1) The isolation winner tag differs: the record's three concurre |
| [M-solidstart-cf](cells/M-solidstart-cf/) | SolidStart 1.3 (vinxi 0.5 + Nitro, `cloudflare-module` preset) on Cloudflare Workers (work |  | yes | yes | None on the seven server capabilities: every verdict, envelope shape and error text reproduces, only trace ids and the w |
| [M-solidstart-deno](cells/M-solidstart-deno/) | M-solidstart-deno on  |  | present |  |  |
| [M-sveltekit-bun](cells/M-sveltekit-bun/) | SvelteKit 2.70.3 (svelte 5, `sv create` minimal template, `@sveltejs/adapter-node` 5.x, vi |  | yes | yes | No verdict differs; all eight capability verdicts reproduce exactly, including both setup facts the record calls out (se |
| [M-sveltekit-cf](cells/M-sveltekit-cf/) | M-sveltekit-cf on  |  | present |  |  |
| [M-sveltekit-deno](cells/M-sveltekit-deno/) | SvelteKit 2 (@sveltejs/kit 2.x, adapter-node 5.x, svelte 5, vite 6) + @sentry/sveltekit 10 |  | yes | yes | None that changes a verdict. One cosmetic divergence: the warning "`@sentry/server-runtime-injection` was bundled into y |
| [M-tanstack-bun](cells/M-tanstack-bun/) | TanStack Start (React) 1.168.35 + @tanstack/react-router 1.170.18, nitro 3 beta node-serve |  | yes | yes | None in behavior: all eight recorded verdicts reproduce exactly. Two environment notes. (1) Bun is 1.4.2 on this machine |
| [M-tanstack-cf](cells/M-tanstack-cf/) | TanStack Start (React) v1.136 with @tanstack/react-start file-based routing on Cloudflare  |  | yes | yes | No verdict changed; all seven capabilities reproduce, plus the recorded stream-lifecycle cross-check. Cosmetic/environme |
| [M-tanstack-deno](cells/M-tanstack-deno/) | TanStack Start (React) 1.168.35 / @tanstack/react-router 1.170.18, nitro 3.0.260903-beta n |  | yes | yes | None on verdicts. Cosmetic: every transaction also carries a `middleware globalRequestMiddleware` child span (record had |

Rebuild status: 105 results; matches: {'yes': 101, 'partial': 4}.
