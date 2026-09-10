# Server segments keep a method-only name although the framework knows the route

Milestone: XPlatform Functionality Gaps
Labels: JavaScript, Bug
Priority: High

Under the default stream lifecycle the segment span of a server request is named `GET` with source `url` on stacks whose own instrumentation holds the route pattern. TanStack Start names every segment `GET`, `/users/42` and `/api/sentry-example` included, with no `http.route`, and the server log carries `[Tracing] Ignoring name source on a child span: this attribute is only valid on the root span.` once per request: the request middleware renames a child rather than the segment. The SDK's own e2e test expects `GET /users/$userId` under `traceLifecycle: 'static'` (DOC-Q102, `results-nitro.json`).

Nuxt names static routes `GET` and gives a route name only to parameterized routes and to requests with a query string, because `packages/nuxt/src/runtime/hooks/updateRouteBeforeResponse.ts:27` sets the route only when `matchedRoutePath !== requestPath` (DOC-Q91, `results-plain.json`). SolidStart names every segment `GET` or `POST` with the path in `url.path` (DOC-Q106, `results-import-src.json`), the stream-lifecycle case of the SolidStart naming ticket in this milestone.

**Work item.** Rename the segment span, not the active child, in the TanStack Start request middleware, and drop the path-inequality guard in the Nuxt hook.

**Evidence.** Getting-started reproductions [`quickstarts/tanstackstart-react/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/tanstackstart-react), [`quickstarts/nuxt/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/nuxt), [`quickstarts/solidstart/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/solidstart), run in September 2026 against develop `03aaf42455` (package 10.67.0); results in `results-*.json` and the README of each directory.
