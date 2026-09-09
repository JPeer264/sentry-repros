# Getting-started paths

One directory per docs guide: the install, configure and verify steps as a new user would run them, with the manual-setup variants the guide names, against the develop build. Status from `_records/getting-started-plan.json`; a done row links its directory, whose README carries the observations and the per-variant `results-*.json`.

| Path | Group | Guide | Variants | Status | Note |
| --- | --- | --- | --- | --- | --- |
| [QS-browser](browser/) | browser | javascript (plain browser) | npm ESM, loader script, CDN bundle, late initialization, esm-without-import | done | headless Chrome (playwright-core + system Chrome); npm, CDN (two bundles), late initialization, CommonJS and 127.0.0.1 variants run; loader script not runnable offline; lightweight page removed in v11 (SDK-1352) |
| [QS-react](react/) | browser framework | react | npm, manual setup | done | esbuild + headless Chrome; nine variants run across the guide, error boundary, React Router v7/v8, Profiler and Redux; component names (Babel plugin) and TanStack Router not run |
| [QS-vue](vue/) | browser framework | vue | npm, manual setup | done | esbuild + headless Chrome with the full Vue build alias; eleven variants across the guide, Vue Router, component tracking, Pinia, multiple apps and late init; the Vue 2 tab and the source-maps wizard not run |
| [QS-angular](angular/) | browser framework | angular | npm, manual setup | done | Angular CLI build + headless Chrome; ten variants across manual-setup, the error handler and component tracking pages; the wizard-only index page not run |
| [QS-svelte](svelte/) | browser framework | svelte | npm, manual setup | done | esbuild-svelte + headless Chrome; five variants across the guide and the component tracking page; the Svelte 3-4 tabs and the source-maps wizard not run |
| [QS-solid](solid/) | browser framework | solid | npm, manual setup | done | esbuild-plugin-solid + headless Chrome; seven variants across the guide, the router pages and the error boundary; the TanStack Router page not runnable as printed |
| QS-ember | browser framework | ember | npm, manual setup | planned | build plus headless Chrome |
| QS-gatsby | browser framework | gatsby | npm, manual setup | planned | build plus headless Chrome |
| [QS-wasm](wasm/) | browser | wasm | npm | done | headless Chrome with a wabt-assembled module; four variants with and without a build_id section |
| [QS-node](node/) | plain runtime | node | documented, manual variants | done |  |
| [QS-bun](bun/) | plain runtime | bun | documented, manual variants | done | bun 1.4.2 |
| [QS-deno](deno/) | plain runtime | deno | documented, manual variants | done | deno 2.9.0 |
| [QS-cloudflare](cloudflare/) | plain runtime | cloudflare | documented, manual variants | done | wrangler local |
| [QS-cloudflare-pages](cloudflare-pages/) | plain runtime | cloudflare (Pages functions middleware) | sentryPagesPlugin | done | wrangler pages dev with the develop tarballs; five variants across the middleware placement and the compatibility flags |
| [QS-express](express/) | node framework | express | npm, manual setup | done | Node 26.5.0 with the develop tarballs; eleven variants across the install variants, the error handler, the integration options and express 4 and 5 |
| [QS-fastify](fastify/) | node framework | fastify | npm, manual setup | done | Node 26.5.0 with the develop tarballs; thirteen variants across the install variants, the error handler page, the integration options and fastify 4 and 5 |
| [QS-koa](koa/) | node framework | koa | npm, manual setup | done | Node 26.5.0 with the develop tarballs; fourteen variants across the install variants, the error handler, the integration options and the verify snippet |
| [QS-hapi](hapi/) | node framework | hapi | npm, manual setup | done | Node 26.5.0 with the develop tarballs; thirteen variants across the install variants, the error handler, the integration options and the verify snippet |
| [QS-nestjs](nestjs/) | node framework | nestjs | npm, manual setup | done | tsc build + Node with the develop tarballs; ten variants across the guide, the filters, the decorators and the install pages |
| [QS-connect](connect/) | node framework | connect | npm, manual setup | done | Node 26.5.0 with the develop tarballs; fourteen variants; no printed app starts because the Connect helper and integration no longer exist |
| [QS-hono](hono/) | node framework | hono | npm, manual setup | done | Node tab only (Bun, Deno and Cloudflare are in the cells); thirteen variants across the install pages, the error handler page and the verify snippets |
| [QS-elysia](elysia/) | node framework | elysia | npm, manual setup | done | Node tab only (Bun and Deno are in the cells); eight variants |
| [QS-nitro](nitro/) | node framework | nitro | npm, manual setup | done | Node 26.5.0 with the develop tarballs; ten variants on two Nitro betas |
| [QS-effect](effect/) | node framework | effect | npm, manual setup | done | Node 26.5.0 with the develop tarballs; eight variants on Effect v3 and v4 |
| [QS-mastra](mastra/) | node framework | mastra | npm, manual setup | done | Node 26.5.0 with the develop tarballs and a mock model endpoint; six variants across the exporter shapes and the built-in integration |
| [QS-nextjs](nextjs/) | meta-framework | nextjs | wizard is out of scope, manual setup, install variants | done | next build with Turbopack, next start on Node plus Chrome; App Router end to end, Pages Router client init and instrumentation step; resumed once after a rate limit |
| [QS-nuxt](nuxt/) | meta-framework | nuxt | wizard is out of scope, manual setup, install variants | done | nuxt build plus node .output/server/index.mjs and Chrome; four variants across the start command and the deprecated inject modes; resumed once after a rate limit |
| [QS-sveltekit](sveltekit/) | meta-framework | sveltekit | wizard is out of scope, manual setup, install variants | done | vite build with adapter-node, node build on Node plus Chrome; two variants; resumed once after a rate limit |
| [QS-astro](astro/) | meta-framework | astro | wizard is out of scope, manual setup, install variants | done | astro build with the Node adapter plus Chrome; seven variants; resumed once after a rate limit |
| [QS-remix](remix/) | meta-framework | remix | wizard is out of scope, manual setup, install variants | done | remix vite:build, remix-serve and Express on Node plus Chrome; seven variants; resumed once after a rate limit |
| QS-react-router | meta-framework | react-router | wizard is out of scope, manual setup, install variants | planned | server on Node plus the client in headless Chrome |
| [QS-tanstackstart-react](tanstackstart-react/) | meta-framework | tanstackstart-react | wizard is out of scope, manual setup, install variants | done | vite build with nitro, node --import on Node plus Chrome; three variants |
| [QS-solidstart](solidstart/) | meta-framework | solidstart | wizard is out of scope, manual setup, install variants | done | SolidStart 2 with nitro on Node plus Chrome; three variants; SolidStart 1 with vinxi not run |
| [QS-aws-lambda](aws-lambda/) | serverless | aws-lambda | npm, layer, container-image, esm-npm, cjs-npm | done | npm path invoked locally with a fake event, fourteen variants; the layer and container paths need AWS and stay unmeasured |
| [QS-gcp-functions](gcp-functions/) | serverless | gcp-functions | npm | done | functions-framework locally with the develop tarballs; thirteen variants across the HTTP, Background and CloudEvent tabs and the instrumentation page |
| [QS-azure-functions](azure-functions/) | serverless | azure-functions | npm | done | host stand-in with fake v3 and v4 contexts; seven variants; the real Azure host not run |
| QS-firebase | serverless | firebase | npm | not measurable | needs the Firebase emulator; not run on this machine |
| QS-electron | desktop | electron | npm | not measurable | separate repository getsentry/sentry-electron; not the develop of sentry-javascript |
| QS-capacitor | mobile | capacitor | npm | not measurable | separate repository; needs a device or simulator |
| QS-cordova | mobile | cordova | npm | not measurable | separate repository; needs a device or simulator |

Totals: 33 done, 4 not measurable, 3 planned.
