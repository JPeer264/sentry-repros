# Add e2e apps for the verified Deno framework cells

Milestone: Deno Test Coverage
Labels: JavaScript, Deno, Tests
Priority: Medium

Only `hono-4 (deno)` runs a real framework on Deno in CI; the Deno orchestrion suites publish channels by hand (JS-3523). Sixteen framework cells were verified on Deno 2.9, with the wiring in their records. Fastify works with no hook, Next.js, Nuxt (node-server output), SvelteKit and Astro work with one integration added, and the rest need the JSON hook or the esbuild build.

**Work item.** Port the cells into e2e apps, starting with Fastify, Next.js, Nuxt, SvelteKit and Astro, and add Deno 2.9 to the runner (JS-3524).

**Evidence.** `cells/M-*-deno/`, and the framework grid in `_reports/deep-probe-report.html`.
