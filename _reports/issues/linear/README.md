# Linear ticket drafts

Project: Improve Server Runtime + Framework Compatibility [JS]. Not created. Evidence links point at https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements.

| # | Milestone | Title | Labels | Priority | File |
| --- | --- | --- | --- | --- | --- |
| 1 | Bun + Framework gaps | Framework SDKs on Bun record no request or fetch spans unless the Bun integrations are added by hand | JavaScript, Bun, Bug | High | `01-framework-sdks-on-bun-record-no-request-or-fetch-spans-unles.md` |
| 2 | Bun + Framework gaps | Hono on Bun: inlining `hono` in the Bun bundle drops route names and error capture | JavaScript, Bun, Bug | Medium | `02-hono-on-bun-inlining-hono-in-the-bun-bundle-drops-route-name.md` |
| 3 | Bun + Framework gaps | NestJS on Bun: the documented `@sentry/nestjs` init loses route names, and the plugin build fails without Nest peers as externals | JavaScript, Bun, Bug | Medium | `03-nestjs-on-bun-the-documented-sentry-nestjs-init-loses-route-.md` |
| 4 | Bun + Framework gaps | Remix on Bun: the request handler patch never runs when the server runtime is inlined | JavaScript, Bun, Bug | Medium | `04-remix-on-bun-the-request-handler-patch-never-runs-when-the-s.md` |
| 5 | Bun + Framework gaps | React Router on Bun: the documented server entry depends on `renderToPipeableStream`, which Bun does not provide | JavaScript, Bun, Bug | Medium | `05-react-router-on-bun-the-documented-server-entry-depends-on-r.md` |
| 6 | Bun + Framework gaps | TanStack Start on Bun: Vite plugin order crashes the build, and parameterized route names are never produced | JavaScript, Bun, Bug | Medium | `06-tanstack-start-on-bun-vite-plugin-order-crashes-the-build-an.md` |
| 7 | Bun + Framework gaps | Nuxt `bun` preset: the server init is never loaded because Bun ignores `NODE_OPTIONS` | JavaScript, Bun, Improvement | Medium | `07-nuxt-bun-preset-the-server-init-is-never-loaded-because-bun-.md` |
| 8 | Deno + Framework gaps | Express, Hapi, Koa and NestJS on Deno: hook order and JSON-require failures per framework | JavaScript, Deno, Bug | High | `08-express-hapi-koa-and-nestjs-on-deno-hook-order-and-json-requ.md` |
| 9 | Deno + Framework gaps | Fresh on Deno: errors swallowed, no route names, and the route Fresh sets is dropped for lack of a context manager | JavaScript, Deno, Bug | High | `09-fresh-on-deno-errors-swallowed-no-route-names-and-the-route-.md` |
| 10 | Deno + Framework gaps | Oak on Deno: `app.listen()` runs handlers outside the request context | JavaScript, Deno, Bug | Medium | `10-oak-on-deno-app-listen-runs-handlers-outside-the-request-con.md` |
| 11 | Deno + Framework gaps | Elysia on Deno: `@sentry/elysia` init delegates to the Bun SDK and never instruments `Deno.serve` | JavaScript, Deno, Bug | High | `11-elysia-on-deno-sentry-elysia-init-delegates-to-the-bun-sdk-a.md` |
| 12 | Deno + Framework gaps | Nuxt `deno_server` preset has no request instrumentation | JavaScript, Deno, Bug | Medium | `12-nuxt-deno-server-preset-has-no-request-instrumentation.md` |
| 13 | Deno + Framework gaps | Next.js on Deno fails every request unless runtime channel injection is off | JavaScript, Deno, Bug | High | `13-next-js-on-deno-fails-every-request-unless-runtime-channel-i.md` |
| 14 | Deno + Framework gaps | Deno leaks the AsyncLocalStorage store across requests after a dynamic import | JavaScript, Deno, Bug | Medium | `14-deno-leaks-the-asynclocalstorage-store-across-requests-after.md` |
| 15 | Cloudflare + Framework gaps | No warning when a Worker is bundled without build-time instrumentation | JavaScript, Cloudflare Workers, Improvement | High | `15-no-warning-when-a-worker-is-bundled-without-build-time-instr.md` |
| 16 | Cloudflare + Framework gaps | Koa on Workers: instrumented `use()` starts a span at startup, which workerd rejects | JavaScript, Cloudflare Workers, Bug | Medium | `16-koa-on-workers-instrumented-use-starts-a-span-at-startup-whi.md` |
| 17 | Cloudflare + Framework gaps | Hapi on Workers: an early `close` turns every response into a 499 and the error event never fires | JavaScript, Cloudflare Workers, Bug | Medium | `17-hapi-on-workers-an-early-close-turns-every-response-into-a-4.md` |
| 18 | Cloudflare + Framework gaps | SvelteKit on Workers: the segment span keeps the URL and never gets the route id | JavaScript, Cloudflare Workers, Bug | High | `18-sveltekit-on-workers-the-segment-span-keeps-the-url-and-neve.md` |
| 19 | Cloudflare + Framework gaps | Nuxt on Workers: parameterless routes are named by method only | JavaScript, Cloudflare Workers, Bug | Medium | `19-nuxt-on-workers-parameterless-routes-are-named-by-method-onl.md` |
| 20 | Cloudflare + Framework gaps | Remix on Workers: the bare `@sentry/remix` import captures nothing in a webworker SSR build | JavaScript, Cloudflare Workers, Bug | High | `20-remix-on-workers-the-bare-sentry-remix-import-captures-nothi.md` |
| 21 | Cloudflare + Framework gaps | Next.js via OpenNext: outgoing fetch is uninstrumented without the Cloudflare fetch integration | JavaScript, Cloudflare Workers, Bug | Medium | `21-next-js-via-opennext-outgoing-fetch-is-uninstrumented-withou.md` |
| 22 | Cloudflare + Framework gaps | SolidStart on Workers: no server-side code path and no server-to-client trace | JavaScript, Cloudflare Workers, Feature | Medium | `22-solidstart-on-workers-no-server-side-code-path-and-no-server.md` |
| 23 | Cloudflare + Framework gaps | Fresh on Workers: the Sentry Vite plugin breaks the driver when no worker environment exists | JavaScript, Cloudflare Workers, Bug | Low | `23-fresh-on-workers-the-sentry-vite-plugin-breaks-the-driver-wh.md` |
| 24 | Cloudflare + Framework gaps | Decision: Fastify does not run on Cloudflare Workers | JavaScript, Cloudflare Workers, Task | Low | `24-decision-fastify-does-not-run-on-cloudflare-workers.md` |
| 25 | Bun Functionality Gaps | Bun garbage-collects the diagnostics channels the SDK subscribes to | JavaScript, Bun, Bug | High | `25-bun-garbage-collects-the-diagnostics-channels-the-sdk-subscr.md` |
| 26 | Deno Functionality Gaps | Ship a JSON load-hook shim for the module hook | JavaScript, Deno, Bug | High | `26-ship-a-json-load-hook-shim-for-the-module-hook.md` |
| 27 | Deno Functionality Gaps | `denoCronIntegration` crashes `init` on Deno 2.9, and its JSDoc claims a default it is not | JavaScript, Deno, Bug | High | `27-denocronintegration-crashes-init-on-deno-2-9-and-its-jsdoc-c.md` |
| 28 | Deno Functionality Gaps | The import hook is silent when it transforms nothing | JavaScript, Deno, Improvement | Medium | `28-the-import-hook-is-silent-when-it-transforms-nothing.md` |
| 29 | Deno Functionality Gaps | Events report the package as `denoland:sentry` | JavaScript, Deno, Bug | Low | `29-events-report-the-package-as-denoland-sentry.md` |
| 30 | Deno Functionality Gaps | The Deno import hook requires `--allow-env` at module load through the vendored debug package | JavaScript, Deno, Bug | Medium | `30-the-deno-import-hook-requires-allow-env-at-module-load-throu.md` |
| 31 | CF Functionality Gaps | Errors inside `ctx.waitUntil()` are never captured | JavaScript, Cloudflare Workers, Bug | High | `31-errors-inside-ctx-waituntil-are-never-captured.md` |
| 32 | CF Functionality Gaps | Dedupe drops repeated errors across requests with the cached client | JavaScript, Cloudflare Workers, Bug | Medium | `32-dedupe-drops-repeated-errors-across-requests-with-the-cached.md` |
| 33 | CF Functionality Gaps | The `/request` entry runs without an async-context strategy under the stream lifecycle | JavaScript, Cloudflare Workers, Bug | High | `33-the-request-entry-runs-without-an-async-context-strategy-und.md` |
| 34 | CF Functionality Gaps | Cloudflare Vite plugin: silent no-op without `wranglerConfigPath`, silent fallback without the options file | JavaScript, Cloudflare Workers, Bug | High | `34-cloudflare-vite-plugin-silent-no-op-without-wranglerconfigpa.md` |
| 35 | CF Functionality Gaps | Cloudflare segment span reports status ok on a 500 response | JavaScript, Cloudflare Workers, Spans, Bug | Medium | `35-cloudflare-segment-span-reports-status-ok-on-a-500-response.md` |
| 36 | XPlatform Functionality Gaps | SolidStart names transactions by URL and swallows API-route errors on every runtime | JavaScript, Bug | Medium | `36-solidstart-names-transactions-by-url-and-swallows-api-route-.md` |
| 37 | XPlatform Functionality Gaps | Package READMEs show wiring that does not resolve | JavaScript, Task | Low | `37-package-readmes-show-wiring-that-does-not-resolve.md` |
| 38 | XPlatform Functionality Gaps | Error events on Bun and Cloudflare carry no `transaction` field | JavaScript, Bun, Cloudflare Workers, Bug | Medium | `38-error-events-on-bun-and-cloudflare-carry-no-transaction-fiel.md` |
| 39 | XPlatform Functionality Gaps | `debug: true` prints no SDK name, version or runtime on any runtime | JavaScript, Improvement | Low | `39-debug-true-prints-no-sdk-name-version-or-runtime-on-any-runt.md` |
| 40 | Bun Test Coverage | Add e2e apps for the verified Bun framework cells | JavaScript, Bun, Tests | Medium | `40-add-e2e-apps-for-the-verified-bun-framework-cells.md` |
| 41 | Deno Test Coverage | Add e2e apps for the verified Deno framework cells | JavaScript, Deno, Tests | Medium | `41-add-e2e-apps-for-the-verified-deno-framework-cells.md` |
| 42 | CF Test Coverage | Make the Cloudflare framework e2e apps required and add the missing ones | JavaScript, Cloudflare Workers, Tests | Medium | `42-make-the-cloudflare-framework-e2e-apps-required-and-add-the-.md` |
| 43 | Documentation Correctness | Track the Bun docs issues from the runtime docs audit | JavaScript, Task | Medium | `43-track-the-bun-docs-issues-from-the-runtime-docs-audit.md` |
| 44 | Documentation Correctness | Track the Deno docs issues from the runtime docs audit | JavaScript, Task | Medium | `44-track-the-deno-docs-issues-from-the-runtime-docs-audit.md` |
| 45 | Documentation Correctness | Track the Cloudflare docs issues from the runtime docs audit | JavaScript, Task | Medium | `45-track-the-cloudflare-docs-issues-from-the-runtime-docs-audit.md` |
