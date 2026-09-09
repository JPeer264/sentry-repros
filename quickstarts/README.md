# Getting-started paths

One directory per docs guide: the install, configure and verify steps as a new user would run them, with the manual-setup variants the guide names, against the develop build. Status from `_records/getting-started-plan.json`; a done row links its directory, whose README carries the observations and the per-variant `results-*.json`.

| Path | Group | Guide | Variants | Status | Note |
| --- | --- | --- | --- | --- | --- |
| [QS-browser](browser/) | browser | javascript (plain browser) | npm ESM, loader script, CDN bundle, late initialization, esm-without-import | done | headless Chrome (playwright-core + system Chrome); npm, CDN (two bundles), late initialization, CommonJS and 127.0.0.1 variants run; loader script not runnable offline; lightweight page removed in v11 (SDK-1352) |
| [QS-react](react/) | browser framework | react | npm, manual setup | done | esbuild + headless Chrome; nine variants run across the guide, error boundary, React Router v7/v8, Profiler and Redux; component names (Babel plugin) and TanStack Router not run |
| [QS-vue](vue/) | browser framework | vue | npm, manual setup | done | esbuild + headless Chrome with the full Vue build alias; eleven variants across the guide, Vue Router, component tracking, Pinia, multiple apps and late init; the Vue 2 tab and the source-maps wizard not run |
| QS-angular | browser framework | angular | npm, manual setup | planned | build plus headless Chrome |
| QS-svelte | browser framework | svelte | npm, manual setup | planned | build plus headless Chrome |
| QS-solid | browser framework | solid | npm, manual setup | planned | build plus headless Chrome |
| QS-ember | browser framework | ember | npm, manual setup | planned | build plus headless Chrome |
| QS-gatsby | browser framework | gatsby | npm, manual setup | planned | build plus headless Chrome |
| QS-wasm | browser | wasm | npm | planned | headless Chrome with a wasm module |
| [QS-node](node/) | plain runtime | node | documented, manual variants | done |  |
| [QS-bun](bun/) | plain runtime | bun | documented, manual variants | done | bun 1.4.2 |
| [QS-deno](deno/) | plain runtime | deno | documented, manual variants | done | deno 2.9.0 |
| [QS-cloudflare](cloudflare/) | plain runtime | cloudflare | documented, manual variants | done | wrangler local |
| QS-cloudflare-pages | plain runtime | cloudflare (Pages functions middleware) | sentryPagesPlugin | planned | wrangler pages dev |
| QS-express | node framework | express | npm, manual setup | planned | Node with the develop tarballs; hono and elysia also on their other runtimes in the cells |
| QS-fastify | node framework | fastify | npm, manual setup | planned | Node with the develop tarballs; hono and elysia also on their other runtimes in the cells |
| QS-koa | node framework | koa | npm, manual setup | planned | Node with the develop tarballs; hono and elysia also on their other runtimes in the cells |
| QS-hapi | node framework | hapi | npm, manual setup | planned | Node with the develop tarballs; hono and elysia also on their other runtimes in the cells |
| QS-nestjs | node framework | nestjs | npm, manual setup | planned | Node with the develop tarballs; hono and elysia also on their other runtimes in the cells |
| QS-connect | node framework | connect | npm, manual setup | planned | Node with the develop tarballs; hono and elysia also on their other runtimes in the cells |
| QS-hono | node framework | hono | npm, manual setup | planned | Node with the develop tarballs; hono and elysia also on their other runtimes in the cells |
| QS-elysia | node framework | elysia | npm, manual setup | planned | Node with the develop tarballs; hono and elysia also on their other runtimes in the cells |
| QS-nitro | node framework | nitro | npm, manual setup | planned | Node with the develop tarballs; hono and elysia also on their other runtimes in the cells |
| QS-effect | node framework | effect | npm, manual setup | planned | Node with the develop tarballs; hono and elysia also on their other runtimes in the cells |
| QS-mastra | node framework | mastra | npm, manual setup | planned | Node with the develop tarballs; hono and elysia also on their other runtimes in the cells |
| QS-nextjs | meta-framework | nextjs | wizard is out of scope, manual setup, install variants | planned | server on Node plus the client in headless Chrome |
| QS-nuxt | meta-framework | nuxt | wizard is out of scope, manual setup, install variants | planned | server on Node plus the client in headless Chrome |
| QS-sveltekit | meta-framework | sveltekit | wizard is out of scope, manual setup, install variants | planned | server on Node plus the client in headless Chrome |
| QS-astro | meta-framework | astro | wizard is out of scope, manual setup, install variants | planned | server on Node plus the client in headless Chrome |
| QS-remix | meta-framework | remix | wizard is out of scope, manual setup, install variants | planned | server on Node plus the client in headless Chrome |
| QS-react-router | meta-framework | react-router | wizard is out of scope, manual setup, install variants | planned | server on Node plus the client in headless Chrome |
| QS-tanstackstart-react | meta-framework | tanstackstart-react | wizard is out of scope, manual setup, install variants | planned | server on Node plus the client in headless Chrome |
| QS-solidstart | meta-framework | solidstart | wizard is out of scope, manual setup, install variants | planned | server on Node plus the client in headless Chrome |
| QS-aws-lambda | serverless | aws-lambda | npm, layer, container-image, esm-npm, cjs-npm | planned | npm path invoked locally with a fake event; the layer and container paths need AWS and stay unmeasured |
| QS-gcp-functions | serverless | gcp-functions | npm | planned | functions-framework locally |
| QS-azure-functions | serverless | azure-functions | npm | planned | the wrapper invoked locally with a fake context; no core tools |
| QS-firebase | serverless | firebase | npm | not measurable | needs the Firebase emulator; not run on this machine |
| QS-electron | desktop | electron | npm | not measurable | separate repository getsentry/sentry-electron; not the develop of sentry-javascript |
| QS-capacitor | mobile | capacitor | npm | not measurable | separate repository; needs a device or simulator |
| QS-cordova | mobile | cordova | npm | not measurable | separate repository; needs a device or simulator |

Totals: 29 planned, 7 done, 4 not measurable.
