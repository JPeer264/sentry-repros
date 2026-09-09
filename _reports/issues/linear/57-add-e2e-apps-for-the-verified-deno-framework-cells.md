# Add e2e apps for the verified Deno framework cells

Milestone: Deno Test Coverage
Labels: JavaScript, Deno, Tests
Priority: Medium

Only `hono-4 (deno)` runs a real framework on Deno in CI; the Deno orchestrion suites publish channels by hand (JS-3523). Sixteen framework cells were verified on Deno 2.9, with the wiring in their records. Fastify works with no hook at all, SvelteKit and Astro need one fetch integration added, Next.js needs `enableRuntimeChannelInjection: false` next to that integration, Nuxt has to keep the `node-server` output, and the rest need the JSON load hook or the esbuild build.

**Work item.** Port the cells into e2e apps, starting with Fastify, Next.js, Nuxt, SvelteKit and Astro, and add Deno 2.9 to the runner (JS-3524).

**Evidence.** [`cells/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells) (the `M-*-deno` directories), and the framework grid in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html).
