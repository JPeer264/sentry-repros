# Cloudflare Pages: the file route never reaches the segment span

Milestone: CF Functionality Gaps
Labels: JavaScript, Cloudflare Workers, Bug
Priority: Medium

Every Pages function route arrives as a segment named `GET` with source `url` and no `http.route`, the parameterized `functions/api/users/[id].js` included, so Pages file routes are invisible as routes (DOC-Q84, `results-base.json`). `sentryPagesPlugin` (`packages/cloudflare/src/pages-plugin.ts:78-93`) hands the request straight to `wrapRequestHandlerWithInit` and reads neither `context.params` nor the function path, which is the only place the route pattern exists.

**Work item.** Derive the route from the Pages function path and set it on the segment span, next to the Nuxt and SvelteKit renaming work in this milestone.

**Evidence.** Getting-started reproduction [`quickstarts/cloudflare-pages/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/cloudflare-pages), run in September 2026 against develop `03aaf42455` (package 10.67.0); results in `results-*.json` and the README of each directory.
