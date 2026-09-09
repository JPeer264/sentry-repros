# v11 docs minimum: getting started and manual setup

The docs changes a new user hits on the way from install to the first event, on Node, Bun, Deno, Cloudflare Workers and in the browser, plus the framework pages that contradict a verified run. Every line links to its draft in [P0](#file-p0-md), [P1](#file-p1-md) or [P2](#file-p2-md). Tiers: **must** blocks or misleads the first setup on develop; **should** is wrong or incomplete for something most users do next; **later** is hygiene. Items owned by a Linear ticket are marked; they still belong in the release, only filed elsewhere.

## Every runtime guide

- [ ] **Must land with v11** · P0 · DOC-R1. The stream-mode includes call static the default: [Fix inverted traceLifecycle default in the stream mode includes](#25-fix-inverted-tracelifecycle-default-in-the-stream-mode-includes)
- [ ] **Must land with v11** · P1 · DOC-Q1. The verify step and the stream-mode includes describe the static lifecycle as the default: [Rewrite the tracing verify step for the stream lifecycle on the Node, Bun, Deno and Cloudflare guides](#101-rewrite-the-tracing-verify-step-for-the-stream-lifecycle-on-the-node-bun-deno-and-cloudflare-guides)
- [ ] **Must land with v11** · P1 · DOC-Q3. Nothing on the four guides says where a route name comes from: [State on the four guides that route names need a framework integration or a routes map](#103-state-on-the-four-guides-that-route-names-need-a-framework-integration-or-a-routes-map)
- [ ] **Should land with v11** · P2 · X1. "Tracing is enabled by default" on the first page of all three guides: [Fix "Tracing is enabled by default" in the Bun, Deno and Cloudflare enable-tracing includes](#150-fix-tracing-is-enabled-by-default-in-the-bun-deno-and-cloudflare-enable-tracing-includes)

## Migration to v11

- [ ] **Must land with v11** · P1 · X2 · owned by JS-2599. The v10-to-v11 page has no Bun plugin section and no Deno hook paragraph: [Add the per-runtime channel-instrumentation setup to the v10-to-v11 page](#48-add-the-per-runtime-channel-instrumentation-setup-to-the-v10-to-v11-page)
- [ ] **Must land with v11** · P0 · DOC-R20 · owned by SDK-1351. The Bun OpenTelemetry setup includes import a package and exports that no longer exist: [Delete the Bun OpenTelemetry setup includes and drop Bun from custom-setup](#27-delete-the-bun-opentelemetry-setup-includes-and-drop-bun-from-custom-setup)
- [ ] **After the release** · P2 · DOC-R8. V7 migration tables name removed integrations: [Fix removed integration names in the Bun and Deno v7 migration tables](#153-fix-removed-integration-names-in-the-bun-and-deno-v7-migration-tables)

## Next.js

- [ ] **Must land with v11** · P0 · DOC-Q86. Every next.config snippet imports withSentryConfig from an entry that no longer exports it: [Import withSentryConfig from @sentry/nextjs/config in every Next.js config snippet](#20-import-withsentryconfig-from-sentrynextjsconfig-in-every-nextjs-config-snippet)
- [ ] **Must land with v11** · P0 · DOC-Q87. The Pages Router page has no working client init under Turbopack and no instrumentation step: [Fix the Pages Router manual-setup page: instrumentation-client.ts for Turbopack and the instrumentation.ts step](#21-fix-the-pages-router-manual-setup-page-instrumentation-clientts-for-turbopack-and-the-instrumentationts-step)
- [ ] **Should land with v11** · P1 · DOC-Q88. The pages misattribute which errors the error components capture: [Say which Next.js errors global-error.tsx and _error.tsx capture and which come from onRequestError](#138-say-which-nextjs-errors-global-errortsx-and-_errortsx-capture-and-which-come-from-onrequesterror)
- [ ] **After the release** · P2 · DOC-Q89. SaaS-only tunnelRoute, deleted source maps, an undeclared function, a 10% verify sample, plugin telemetry: [Add the missing details to the Next.js manual-setup page](#186-add-the-missing-details-to-the-nextjs-manual-setup-page)

## SvelteKit

- [ ] **Must land with v11** · P0 · DOC-Q92. Every vite.config snippet imports sentrySvelteKit from an entry that no longer exports it: [Import sentrySvelteKit from @sentry/sveltekit/vite in every SvelteKit config snippet](#22-import-sentrysveltekit-from-sentrysveltekitvite-in-every-sveltekit-config-snippet)
- [ ] **Should land with v11** · P1 · DOC-Q93. The custom handleErrorWithSentry handler marks every server error handled: [Say on the SvelteKit page that a custom handleErrorWithSentry handler marks errors as handled](#140-say-on-the-sveltekit-page-that-a-custom-handleerrorwithsentry-handler-marks-errors-as-handled)
- [ ] **After the release** · P2 · DOC-Q94. Unknown-route spans, segment status on 500, an outdated load rationale, a stale Vite prerequisite: [Add the missing details to the SvelteKit manual-setup and build pages](#188-add-the-missing-details-to-the-sveltekit-manual-setup-and-build-pages)

## Remix

- [ ] **Must land with v11** · P0 · DOC-Q95. Two snippets fail the build: a doubled handleError export and an uninstalled Vite plugin package: [Fix the Remix entry.server snippet with two handleError exports and the vite.config import of an uninstalled package](#23-fix-the-remix-entryserver-snippet-with-two-handleerror-exports-and-the-viteconfig-import-of-an-uninstalled-package)
- [ ] **Should land with v11** · P1 · DOC-Q96. The start command does not work with a Vite build: [Print the Vite template's start command on the Remix page](#141-print-the-vite-templates-start-command-on-the-remix-page)
- [ ] **Should land with v11** · P1 · DOC-Q97. The captureActionFormDataKeys claim describes data that never appears on errored actions: [Correct the captureActionFormDataKeys description on the Remix page](#142-correct-the-captureactionformdatakeys-description-on-the-remix-page)
- [ ] **After the release** · P2 · DOC-Q98. Transactions wording, a missing import, served source maps, the sanitized boundary event, no release: [Add the missing details to the Remix page](#189-add-the-missing-details-to-the-remix-page)

## Astro

- [ ] **Should land with v11** · P1 · DOC-Q99. The verify endpoint kills the build on the default static output: [Say on the Astro guide that the verify endpoint needs on-demand rendering](#143-say-on-the-astro-guide-that-the-verify-endpoint-needs-on-demand-rendering)
- [ ] **After the release** · P2 · DOC-Q100. The trackClientIp default, Astro 4 as the minimum, view-transition naming, the delete glob, a missing token: [Add the missing details to the Astro guide and its API reference](#190-add-the-missing-details-to-the-astro-guide-and-its-api-reference)

## Nuxt

- [ ] **Should land with v11** · P1 · DOC-Q90. The pages still make --import the crucial step; the server config is bundled into the Nitro build: [Replace the --import instructions on the Nuxt manual-setup and cli-import pages with the bundled server config](#139-replace-the---import-instructions-on-the-nuxt-manual-setup-and-cli-import-pages-with-the-bundled-server-config)
- [ ] **After the release** · P2 · DOC-Q91. Deprecated inject modes documented as current, Nuxt 4 missing, a verify button that creates a second issue: [Add the missing details to the Nuxt pages](#187-add-the-missing-details-to-the-nuxt-pages)

## Cloudflare Pages

- [ ] **Must land with v11** · P0 · DOC-Q83. The Pages tracing verify snippet uses Sentry without importing it: [Add the SDK import to the Cloudflare Pages tracing verify snippet](#19-add-the-sdk-import-to-the-cloudflare-pages-tracing-verify-snippet)
- [ ] **After the release** · P2 · DOC-Q84. The nodejs_compat requirement depends on the date, method-named spans, waitUntil on Pages: [Add the missing Pages details to the Cloudflare guide and its config include](#185-add-the-missing-pages-details-to-the-cloudflare-guide-and-its-config-include)

## Browser

- [ ] **Must land with v11** · P0 · DOC-Q7. The tracing verify snippet is a SyntaxError: await in a non-async function: [Fix the tracing verify snippet on the browser getting-started page: await inside a non-async function](#1-fix-the-tracing-verify-snippet-on-the-browser-getting-started-page-await-inside-a-non-async-function)
- [ ] **Should land with v11** · P1 · DOC-Q8. The CDN tab names the tracing bundle and adds replayIntegration(), which records nothing: [Match the CDN bundle named on the browser config page to the integrations its snippet uses](#105-match-the-cdn-bundle-named-on-the-browser-config-page-to-the-integrations-its-snippet-uses)
- [ ] **Should land with v11** · P1 · DOC-Q9. Sentry.logger is a silent no-op on the CDN bundles and no page says which bundle has logs: [State on the logs pages which browser CDN bundles include Sentry.logger](#106-state-on-the-logs-pages-which-browser-cdn-bundles-include-sentrylogger)
- [ ] **After the release** · P2 · DOC-Q10. The sample tracePropagationTargets drops headers on 127.0.0.1: [Say on the browser config page that the sample tracePropagationTargets matches localhost only](#160-say-on-the-browser-config-page-that-the-sample-tracepropagationtargets-matches-localhost-only)
- [ ] **After the release** · P2 · DOC-Q11. The verify-flow replay is discarded within the first five seconds: [Tell browser readers to wait before triggering the verify error if they expect a replay](#161-tell-browser-readers-to-wait-before-triggering-the-verify-error-if-they-expect-a-replay)

## React

- [ ] **Must land with v11** · P0 · DOC-Q12. Three React Router v6 and v7 snippets do not run on React 19: [Fix the React Router v6 and v7 page snippets that fail on React 19](#2-fix-the-react-router-v6-and-v7-page-snippets-that-fail-on-react-19)
- [ ] **Should land with v11** · P1 · DOC-Q13. On React 19 the root error hooks silence the ErrorBoundary features: [Say on the React error boundary page how reactErrorHandler and ErrorBoundary interact on React 19](#107-say-on-the-react-error-boundary-page-how-reacterrorhandler-and-errorboundary-interact-on-react-19)
- [ ] **Should land with v11** · P1 · DOC-Q14. The denylist claim does not cover Redux or Pinia state: [Scope the built-in denylist claim on the data-collection include to request data](#108-scope-the-built-in-denylist-claim-on-the-data-collection-include-to-request-data)
- [ ] **Should land with v11** · P1 · DOC-Q15. The Profiler span ops are named wrong: [Rename the Profiler span ops on the React component monitoring page](#109-rename-the-profiler-span-ops-on-the-react-component-monitoring-page)
- [ ] **After the release** · P2 · DOC-Q16. The routing snippet uses the deprecated V7 API: [Move the React guide routing snippet to the version-agnostic React Router API](#162-move-the-react-guide-routing-snippet-to-the-version-agnostic-react-router-api)
- [ ] **After the release** · P2 · DOC-Q17. The verify step says transactions and its test span ends before the error: [Rewrite the React verify step for the stream lifecycle and fix the test span](#163-rewrite-the-react-verify-step-for-the-stream-lifecycle-and-fix-the-test-span)
- [ ] **After the release** · P2 · DOC-Q18. Sessions need a release, on the Vue, Angular, Svelte, Solid and WebAssembly guides too: [Say on the React, Vue, Angular, Svelte, Solid and WebAssembly guides that release health sessions need a release](#164-say-on-the-react-vue-angular-svelte-solid-and-webassembly-guides-that-release-health-sessions-need-a-release)

## Angular

- [ ] **Must land with v11** · P0 · DOC-Q32. Three snippets do not compile under the tsconfig ng new generates: [Fix the Angular manual-setup, error handler and component tracking snippets that fail to build](#7-fix-the-angular-manual-setup-error-handler-and-component-tracking-snippets-that-fail-to-build)
- [ ] **Should land with v11** · P1 · DOC-Q33. No working registration for a subclassed SentryErrorHandler: [Show a working provider for a subclassed SentryErrorHandler on the Angular error handler page](#113-show-a-working-provider-for-a-subclassed-sentryerrorhandler-on-the-angular-error-handler-page)
- [ ] **Should land with v11** · P1 · DOC-Q34. The component tracking span ops are named wrong: [Rename the component tracking span ops on the Angular page](#114-rename-the-component-tracking-span-ops-on-the-angular-page)
- [ ] **After the release** · P2 · DOC-Q35. Transactions wording and a 0 ms verify span: [Rewrite the Angular manual-setup verify and tracing text for the stream lifecycle](#171-rewrite-the-angular-manual-setup-verify-and-tracing-text-for-the-stream-lifecycle)
- [ ] **After the release** · P2 · DOC-Q36. Deprecated bootstrap call, missing logs option, stray line: [Fix the Angular pages' deprecated bootstrap call, the missing logs onboarding option and the stray export](#172-fix-the-angular-pages-deprecated-bootstrap-call-the-missing-logs-onboarding-option-and-the-stray-export)

## Svelte

- [ ] **Must land with v11** · P0 · DOC-Q41. The Svelte v5 verify snippet binds onClick, which compiles to nothing: [Change onClick to onclick in the Svelte v5 tab of the tracing verify snippet](#9-change-onclick-to-onclick-in-the-svelte-v5-tab-of-the-tracing-verify-snippet)
- [ ] **Should land with v11** · P1 · DOC-Q42. Old span ops, the wrong trackUpdates default and no runes caveat on the component tracking page: [Correct the Svelte component tracking page: span ops, the trackUpdates default and the runes-mode limit](#117-correct-the-svelte-component-tracking-page-span-ops-the-trackupdates-default-and-the-runes-mode-limit)
- [ ] **After the release** · P2 · DOC-Q43. Transactions wording, a 0 ms test span and a placeholder that is a syntax error: [Rewrite the Svelte verify and tracing text for the stream lifecycle and fix the compilerOptions placeholder](#174-rewrite-the-svelte-verify-and-tracing-text-for-the-stream-lifecycle-and-fix-the-compileroptions-placeholder)

## Solid

- [ ] **Must land with v11** · P0 · DOC-Q48. The tracing snippet needs @solidjs/router, which the guide never installs: [State on the Solid guide that the tracing snippet requires @solidjs/router](#11-state-on-the-solid-guide-that-the-tracing-snippet-requires-solidjsrouter)
- [ ] **Should land with v11** · P1 · DOC-Q49. The DEV guard skips init under vite dev, so the verify step sends nothing: [Say on the Solid guide that the verify step needs a production build because of the DEV guard](#121-say-on-the-solid-guide-that-the-verify-step-needs-a-production-build-because-of-the-dev-guard)
- [ ] **Should land with v11** · P1 · DOC-Q50. No navigation spans without withSentryRouterRouting: [Add withSentryRouterRouting to the Solid guide's tracing snippet](#122-add-withsentryrouterrouting-to-the-solid-guides-tracing-snippet)
- [ ] **After the release** · P2 · DOC-Q51. TypeScript in a javascript fence and transactions wording: [Fix the TanStack Router snippet fence and the transactions wording on the Solid pages](#175-fix-the-tanstack-router-snippet-fence-and-the-transactions-wording-on-the-solid-pages)

## Vue

- [ ] **Must land with v11** · P0 · DOC-Q19. The Vue Router page's only full example is Vue 2 code that fails on Vue 3: [Add a Vue 3 example to the Vue Router instrumentation page](#3-add-a-vue-3-example-to-the-vue-router-instrumentation-page)
- [ ] **Must land with v11** · P0 · DOC-Q20. The tracingOptions.hooks snippet is a syntax error: [Add the missing comma to the tracingOptions.hooks snippet on the Vue component tracking page](#4-add-the-missing-comma-to-the-tracingoptionshooks-snippet-on-the-vue-component-tracking-page)
- [ ] **Should land with v11** · P1 · DOC-Q21. Wrong default hooks, wrong span ops and a duplicate-key snippet on the component tracking page: [Correct the Vue component tracking page: default hooks, span ops and the duplicate-key snippet](#110-correct-the-vue-component-tracking-page-default-hooks-span-ops-and-the-duplicate-key-snippet)
- [ ] **After the release** · P2 · DOC-Q22. The pages say transactions: [Rewrite the Vue guide and its feature pages for the stream lifecycle](#165-rewrite-the-vue-guide-and-its-feature-pages-for-the-stream-lifecycle)
- [ ] **After the release** · P2 · DOC-Q23. The late-init and multiple-apps snippets miss their imports: [Fix the late-initialization and multiple-apps snippets on the Vue pages](#166-fix-the-late-initialization-and-multiple-apps-snippets-on-the-vue-pages)
- [ ] **After the release** · P2 · DOC-Q24. The dev build reports the verify error without component context: [Say on the Vue guide that the component context of the verify error appears in production builds](#167-say-on-the-vue-guide-that-the-component-context-of-the-verify-error-appears-in-production-builds)

## Browser WebAssembly

- [ ] **Should land with v11** · P1 · DOC-Q63. Debug IDs need a build_id section and a streaming loader the guide never mentions: [Say on the WebAssembly guide what the integration needs: a build_id section, a URL-keeping loader and uploaded debug files](#129-say-on-the-webassembly-guide-what-the-integration-needs-a-build_id-section-a-url-keeping-loader-and-uploaded-debug-files)

## Google Cloud Functions

- [ ] **Must land with v11** · P0 · DOC-Q69. Three exports that do not exist: wrapBackgroundFunction, pgIntegration, ioredisIntegration: [Fix the nonexistent exports on the Google Cloud Functions pages: wrapBackgroundFunction, pgIntegration and ioredisIntegration](#15-fix-the-nonexistent-exports-on-the-google-cloud-functions-pages-wrapbackgroundfunction-pgintegration-and-ioredisintegration)
- [ ] **After the release** · P2 · DOC-Q70. Callback handlers lose the function span, HTTP functions split into two traces, no run step, no logs option: [Add the missing details to the Google Cloud Functions guide: promise-form handlers, the two-trace split, a local run step, the logs option and consistent export names](#180-add-the-missing-details-to-the-google-cloud-functions-guide-promise-form-handlers-the-two-trace-split-a-local-run-step-the-logs-option-and-consistent-export-names)

## AWS Lambda

- [ ] **Must land with v11** · P0 · DOC-Q71. Two snippets do not parse: a stray parenthesis and Promise.rejected: [Fix the stray parenthesis in the AWS Lambda ESM verify handler and Promise.rejected on the wrapper page](#16-fix-the-stray-parenthesis-in-the-aws-lambda-esm-verify-handler-and-promiserejected-on-the-wrapper-page)
- [ ] **Should land with v11** · P1 · DOC-Q72. The ESM tab creates instrument.mjs and the load step imports instrument.js: [Give the AWS Lambda load step the file name its ESM tab creates](#133-give-the-aws-lambda-load-step-the-file-name-its-esm-tab-creates)
- [ ] **Should land with v11** · P1 · DOC-Q73. The wrapper options are overridden by the v11 automatic wrapping: [Say on the Lambda wrapper page that v11 wraps the handler automatically with default options](#134-say-on-the-lambda-wrapper-page-that-v11-wraps-the-handler-automatically-with-default-options)
- [ ] **After the release** · P2 · DOC-Q74. Verify tabs, a broken anchor, request data, awslambda-auto outside Lambda, transactions comment: [Add the missing details to the AWS Lambda pages](#181-add-the-missing-details-to-the-aws-lambda-pages)

## Azure Functions

- [ ] **Should land with v11** · P1 · DOC-Q81. Request data attached with a metadata key the SDK never reads: [Use normalizedRequest in the Azure Functions request-context snippets](#137-use-normalizedrequest-in-the-azure-functions-request-context-snippets)
- [ ] **After the release** · P2 · DOC-Q82. The wrong SDK in the frontmatter, no invocation span, v3-only snippets, transactions, a hidden logs option: [Add the missing details to the Azure Functions guide](#184-add-the-missing-details-to-the-azure-functions-guide)

## Effect

- [ ] **Must land with v11** · P0 · DOC-Q75. The metrics layer breaks the whole program on Effect v3: [Drop the metrics layer from the Effect v3 snippet, or say it needs Effect v4](#17-drop-the-metrics-layer-from-the-effect-v3-snippet-or-say-it-needs-effect-v4)
- [ ] **Should land with v11** · P1 · DOC-Q76. The verify step promises an issue that nothing captures: [Show the capture a failed effect needs on the Effect guide](#135-show-the-capture-a-failed-effect-needs-on-the-effect-guide)
- [ ] **After the release** · P2 · DOC-Q77. A missing install, an unshown file, the span op, annotations, integrations off: [Add the missing details to the Effect guide](#182-add-the-missing-details-to-the-effect-guide)

## Nitro

- [ ] **Must land with v11** · P0 · DOC-Q78. The install fails on current Nitro betas and the config never registers the verify route: [Fix the Nitro guide's version claim and add serverDir to its config](#18-fix-the-nitro-guides-version-claim-and-add-serverdir-to-its-config)
- [ ] **Should land with v11** · P1 · DOC-Q79. The error and span claims do not match the build: [Correct the Nitro error-capture and span claims](#136-correct-the-nitro-error-capture-and-span-claims)
- [ ] **After the release** · P2 · DOC-Q80. Source maps deleted without a token, an untyped option, the dev double init, $fetch: [Add the missing details to the Nitro guide](#183-add-the-missing-details-to-the-nitro-guide)

## Mastra

- [ ] **Should land with v11** · P1 · DOC-Q67. The built-in mastraIntegration is undocumented and combining it with the exporter duplicates every span: [Document the built-in mastraIntegration route on the Mastra pages and say the exporter must not be combined with it](#132-document-the-built-in-mastraintegration-route-on-the-mastra-pages-and-say-the-exporter-must-not-be-combined-with-it)
- [ ] **After the release** · P2 · DOC-Q68. Wrong attribute names, unnamed defaults and the trace shape on the Mastra pages: [Correct the attribute list, the defaults and the trace shape on the Mastra pages](#179-correct-the-attribute-list-the-defaults-and-the-trace-shape-on-the-mastra-pages)

## Elysia

- [ ] **Should land with v11** · P1 · DOC-Q64. The verify route is added after listen() and is never served: [Chain the Elysia verify route before .listen() on the guide](#130-chain-the-elysia-verify-route-before-listen-on-the-guide)
- [ ] **Should land with v11** · P1 · DOC-Q65. Unmatched routes and status() throws are captured by default, the guide says otherwise: [Correct the default error filter description on the Elysia guide](#131-correct-the-default-error-filter-description-on-the-elysia-guide)
- [ ] **After the release** · P2 · DOC-Q66. A browser paragraph, old ops, a function-name claim and no run command: [Rewrite the Elysia instrumentation include for v11 and add the Node run details](#178-rewrite-the-elysia-instrumentation-include-for-v11-and-add-the-node-run-details)

## Node, Express, Fastify, Koa, Hapi, Connect, Hono and NestJS

- [ ] **Should land with v11** · P2 · DOC-Q5. --require banner, and a first-line ESM import equals --import: [Update the Node getting-started page for --require and for first-line ESM imports](#158-update-the-node-getting-started-page-for---require-and-for-first-line-esm-imports)
- [ ] **Must land with v11** · P1 · DOC-Q85. The Node install pages do not reflect the v11 install-method decision: --import main, bundler plus top-level import, @sentry/node/import with late init, no CommonJS option: [Restructure the Node install methods for v11: --import as the main path, bundler plus top-level import and --import @sentry/node/import as the alternatives, no CommonJS option](#104-restructure-the-node-install-methods-for-v11---import-as-the-main-path-bundler-plus-top-level-import-and---import-sentrynodeimport-as-the-alternatives-no-commonjs-option)
- [ ] **Must land with v11** · P0 · DOC-Q25. The Express, Fastify, Koa, Hapi and Connect ESM tabs import the instrument file without its extension: [Fix the extensionless instrument import on the Express, Fastify, Koa, Hapi and Connect guides and the esm-without-import page](#5-fix-the-extensionless-instrument-import-on-the-express-fastify-koa-hapi-and-connect-guides-and-the-esm-without-import-page)
- [ ] **Must land with v11** · P0 · DOC-Q26. The late-initialization page rests on the removed @sentry/node/preload entry: [Rewrite or remove the late-initialization install page for v11](#6-rewrite-or-remove-the-late-initialization-install-page-for-v11)
- [ ] **Should land with v11** · P1 · DOC-Q27. The Express and Connect async verify snippets hang on Express 4 and Connect 3: [Make the async tracing verify snippets work on Express 4 and Connect 3, or state what they need](#111-make-the-async-tracing-verify-snippets-work-on-express-4-and-connect-3-or-state-what-they-need)
- [ ] **Should land with v11** · P1 · DOC-Q28. The esm-without-import page says a first-line import cannot instrument frameworks; Express, Fastify, Hapi and Hono are: [Correct the first-line import limitation on the esm-without-import page for v11](#112-correct-the-first-line-import-limitation-on-the-esm-without-import-page-for-v11)
- [ ] **After the release** · P2 · DOC-Q29. The Express, Fastify, Koa and Hapi guides teach deprecated error handler calls: [Drop the deprecated setup*ErrorHandler calls from the Express, Fastify, Koa and Hapi getting-started snippets](#168-drop-the-deprecated-setuperrorhandler-calls-from-the-express-fastify-koa-and-hapi-getting-started-snippets)
- [ ] **After the release** · P2 · DOC-Q30. No expressIntegration page: [Add an expressIntegration page to the integrations directory](#169-add-an-expressintegration-page-to-the-integrations-directory)
- [ ] **After the release** · P2 · DOC-Q31. Empty, orphaned and unreachable includes on the Express, Fastify, Koa and Connect guides: [Fix the empty capture-errors include and the orphaned includes on the Express guide](#170-fix-the-empty-capture-errors-include-and-the-orphaned-includes-on-the-express-guide)
- [ ] **Must land with v11** · P0 · DOC-Q37. The Fastify error handler page imports from a package that does not exist: [Fix the Fastify error handler page: @sentry/fastify does not exist and fastify() is never imported](#8-fix-the-fastify-error-handler-page-sentryfastify-does-not-exist-and-fastify-is-never-imported)
- [ ] **Should land with v11** · P1 · DOC-Q38. The Fastify error handler options object is silently ignored: [Move shouldHandleError to fastifyIntegration on the Fastify error handler page](#115-move-shouldhandleerror-to-fastifyintegration-on-the-fastify-error-handler-page)
- [ ] **Should land with v11** · P1 · DOC-Q39. The Fastify supported versions exclude 5: [Correct the supported Fastify versions on the integration page](#116-correct-the-supported-fastify-versions-on-the-integration-page)
- [ ] **After the release** · P2 · DOC-Q40. The Fastify integration page names the wrong mechanism and no behaviour: [Rewrite the Fastify integration page around the diagnostics-channel instrumentation and its options](#173-rewrite-the-fastify-integration-page-around-the-diagnostics-channel-instrumentation-and-its-options)
- [ ] **Must land with v11** · P0 · DOC-Q44. The Koa verify snippet uses a router the guide never creates: [Add the router to the Koa getting-started snippets that the verify step relies on](#10-add-the-router-to-the-koa-getting-started-snippets-that-the-verify-step-relies-on)
- [ ] **Should land with v11** · P1 · DOC-Q45. With a direct import Koa still needs setupKoaErrorHandler, the migration page says otherwise: [Qualify the Koa error handler claims on the migration and esm-without-import pages](#118-qualify-the-koa-error-handler-claims-on-the-migration-and-esm-without-import-pages)
- [ ] **Should land with v11** · P1 · DOC-Q46. The Koa integration page names the wrong mechanism, enablement rule and version range: [Rewrite the Koa integration page around the diagnostics-channel instrumentation](#119-rewrite-the-koa-integration-page-around-the-diagnostics-channel-instrumentation)
- [ ] **Should land with v11** · P1 · DOC-Q47. The Hapi integration page names the wrong mechanism and no option, and its table row says no errors: [Rewrite the Hapi integration page and its table row](#120-rewrite-the-hapi-integration-page-and-its-table-row)
- [ ] **Must land with v11** · P0 · DOC-Q52. The Connect guide and integration page describe a removed instrumentation; every printed app crashes: [Rewrite the Connect guide and integration page for v11, whose SDK has no Connect instrumentation](#12-rewrite-the-connect-guide-and-integration-page-for-v11-whose-sdk-has-no-connect-instrumentation)
- [ ] **Should land with v11** · P1 · DOC-Q53. The Connect verify route never reaches Sentry without an error middleware: [Say on the Connect guide that errors need an error-handling middleware, and show it](#123-say-on-the-connect-guide-that-errors-need-an-error-handling-middleware-and-show-it)
- [ ] **Should land with v11** · P1 · DOC-Q54. The Hono tracing verify snippet uses Sentry without importing it, and the package root exports nothing: [Add the runtime import to the Hono tracing verify snippet](#124-add-the-runtime-import-to-the-hono-tracing-verify-snippet)
- [ ] **Should land with v11** · P1 · DOC-Q55. The install pages initialize Hono from @sentry/node, which the guide forbids: [Point the Hono config snippets on the CommonJS, ESM and ESM-without-import pages at @sentry/hono/node](#125-point-the-hono-config-snippets-on-the-commonjs-esm-and-esm-without-import-pages-at-sentryhononode)
- [ ] **After the release** · P2 · DOC-Q56. Hono guide details: GET /* grouping, options sentence, filter semantics, node-server dependency: [Add the missing details to the Hono guide: catch-all naming, middleware options, error filter semantics and the node-server dependency](#176-add-the-missing-details-to-the-hono-guide-catch-all-naming-middleware-options-error-filter-semantics-and-the-node-server-dependency)
- [ ] **Must land with v11** · P0 · DOC-Q57. The NestJS tracing verify snippet kills the process: [Fix the NestJS tracing verify snippet: its delayed throw is an uncaught exception that exits the app](#13-fix-the-nestjs-tracing-verify-snippet-its-delayed-throw-is-an-uncaught-exception-that-exits-the-app)
- [ ] **Must land with v11** · P0 · DOC-Q58. The NestJS ESM start script is not a runnable command: [Replace the NestJS ESM start script with a command that runs](#14-replace-the-nestjs-esm-start-script-with-a-command-that-runs)
- [ ] **Should land with v11** · P1 · DOC-Q59. No NestJS error reaches Sentry without SentryGlobalFilter; the guide says otherwise: [Say on the NestJS guide that SentryGlobalFilter is required for any HTTP error to be captured, and move it before Verify](#126-say-on-the-nestjs-guide-that-sentryglobalfilter-is-required-for-any-http-error-to-be-captured-and-move-it-before-verify)
- [ ] **Should land with v11** · P1 · DOC-Q60. The Nest integration page names the wrong mechanism, enablement rule and Nest 4: [Rewrite the Nest integration page around the diagnostics-channel instrumentation](#127-rewrite-the-nest-integration-page-around-the-diagnostics-channel-instrumentation)
- [ ] **Should land with v11** · P1 · DOC-Q62. The Node prerequisites include says Node 18 while the v11 packages declare 20.19 and later: [Update the Node prerequisite include to the engines range the v11 packages declare](#128-update-the-node-prerequisite-include-to-the-engines-range-the-v11-packages-declare)
- [ ] **After the release** · P2 · DOC-Q61. NestJS details: the module adds nothing observable, transactions wording, doubled Express spans: [Say what SentryModule does on the NestJS guide, fix the transactions wording and describe the span sets](#177-say-what-sentrymodule-does-on-the-nestjs-guide-fix-the-transactions-wording-and-describe-the-span-sets)

## Bun

- [ ] **Must land with v11** · P0 · DOC-B1. The instrumentation step is backwards and never names the plugin: [Rewrite the Bun guide's instrumentation step around @sentry/bun/plugin](#24-rewrite-the-bun-guides-instrumentation-step-around-sentrybunplugin)
- [ ] **Should land with v11** · P1 · DOC-B2. The integrations table does not match what the SDK installs: [Correct the Bun integrations table in platform-includes/.../javascript.bun.mdx](#37-correct-the-bun-integrations-table-in-platform-includesjavascriptbunmdx)
- [ ] **Should land with v11** · P2 · DOC-Q4. Two warnings on the documented path that no page explains: [Explain the channel-injection warnings on the Bun guide](#157-explain-the-channel-injection-warnings-on-the-bun-guide)
- [ ] **Should land with v11** · P2 · DOC-B4. No Bun version floor, npm install in the Hono tab, no breadcrumbs page: [Fix Bun guide hygiene: version floor, Hono install command, v7 wording](#144-fix-bun-guide-hygiene-version-floor-hono-install-command-v7-wording)

## Deno

- [ ] **Must land with v11** · P1 · DOC-D1. No instrumentation step; the import hook is undocumented: [Document the @sentry/deno/import hook in the Deno guide](#39-document-the-sentrydenoimport-hook-in-the-deno-guide)
- [ ] **Must land with v11** · P1 · DOC-D3. The documented permission flags crash the app under the hook, and silently degrade without it: [Show one complete deno run command with all four permission flags in the Deno guide](#41-show-one-complete-deno-run-command-with-all-four-permission-flags-in-the-deno-guide)
- [ ] **Must land with v11** · P0 · DOC-R2. The crons page recommends an integration that crashes init on Deno 2.9: [Stop recommending denoCronIntegration() on the Deno crons page](#26-stop-recommending-denocronintegration-on-the-deno-crons-page)
- [ ] **Should land with v11** · P1 · DOC-D2. The integrations table lists 8 of 39: [Correct the Deno integrations table in platform-includes/.../javascript.deno.mdx](#40-correct-the-deno-integrations-table-in-platform-includesjavascriptdenomdx)
- [ ] **Should land with v11** · P2 · DOC-D6. Install shows only the npm: specifier; deno add and the import map are missing: [Show deno add and an import map in the Deno guide's install step](#146-show-deno-add-and-an-import-map-in-the-deno-guides-install-step)
- [ ] **After the release** · P2 · DOC-R17. Deno serve is never mentioned: [Add deno serve to the Deno guide run commands](#155-add-deno-serve-to-the-deno-guide-run-commands)

## Cloudflare Workers

- [ ] **Should land with v11** · P1 · DOC-Q2. A wrangler config resolved to the wrong file instruments nothing and logs nothing: [Say on the Vite plugin page that a wrangler config resolved to the wrong file instruments nothing](#102-say-on-the-vite-plugin-page-that-a-wrangler-config-resolved-to-the-wrong-file-instruments-nothing)
- [ ] **Must land with v11** · P1 · DOC-C1 · v11-gated, under SDK-1296. The nodejs_compat entrypoint the guide documents is gone on develop: [Remove the @sentry/cloudflare/nodejs_compat entrypoint from the Cloudflare docs for v11](#43-remove-the-sentrycloudflarenodejs_compat-entrypoint-from-the-cloudflare-docs-for-v11)
- [ ] **Must land with v11** · P1 · DOC-C5 · v11-gated, under SDK-1296. WrapRequestHandler is imported from an entry that no longer exports it: [Import wrapRequestHandler from @sentry/cloudflare/request and drop the honoIntegration page](#46-import-wraprequesthandler-from-sentrycloudflarerequest-and-drop-the-honointegration-page)
- [ ] **Must land with v11** · P1 · DOC-C4 · v11-gated, under SDK-1296. The Vite plugin page documents options that no longer exist and calls the plugin a no-op: [Update features/vite-plugin.mdx to the shipped Cloudflare Vite plugin options](#45-update-featuresvite-pluginmdx-to-the-shipped-cloudflare-vite-plugin-options)
- [ ] **Should land with v11** · P1 · DOC-R14. Errors inside ctx.waitUntil() are never captured; the page covers spans only: [Document that errors inside ctx.waitUntil() are not captured](#98-document-that-errors-inside-ctxwaituntil-are-not-captured)
- [ ] **Should land with v11** · P2 · DOC-C8. Bare Sentry.init snippets, a browser integration, two compatibility dates without a rule: [Fix snippet errors across the Cloudflare includes and framework pages](#149-fix-snippet-errors-across-the-cloudflare-includes-and-framework-pages)
- [ ] **Should land with v11** · P2 · DOC-Q6. Wrangler dev stack traces have no context lines until source maps are uploaded: [Say on the Cloudflare guide that readable stack traces need the source maps step](#159-say-on-the-cloudflare-guide-that-readable-stack-traces-need-the-source-maps-step)
- [ ] **Should land with v11** · P2 · DOC-C3 · v11-gated, under SDK-1296. EnableRpcTracePropagation is replaced; five options have no entry: [Add the four missing Cloudflare SdkOption entries and drop the deprecated enableRpcTracePropagation block](#147-add-the-four-missing-cloudflare-sdkoption-entries-and-drop-the-deprecated-enablerpctracepropagation-block)

## Frameworks whose page contradicts a verified run

- [ ] **Must land with v11** · P0 · DOC-F50. Remix on Workers: the documented import captures nothing: [Rewrite the Remix on Cloudflare page for Workers and fix the Vite plugin options](#29-rewrite-the-remix-on-cloudflare-page-for-workers-and-fix-the-vite-plugin-options)
- [ ] **Must land with v11** · P0 · DOC-F36. Elysia on Workers: runtime list says Bun or Node only: [Add an Elysia on Cloudflare Workers page and drop the Bun/Node-only runtime claim](#30-add-an-elysia-on-cloudflare-workers-page-and-drop-the-bunnode-only-runtime-claim)
- [ ] **Must land with v11** · P0 · DOC-F19. Elysia on Deno: the documented init loses isolation and route names: [Document Elysia on Deno: init from @sentry/deno, or add denoServeIntegration](#31-document-elysia-on-deno-init-from-sentrydeno-or-add-denoserveintegration)
- [ ] **Must land with v11** · P0 · DOC-F11. Nuxt on Bun: presets page says out of the box: [Add a Bun section to the Nuxt Nitro deployment presets page](#32-add-a-bun-section-to-the-nuxt-nitro-deployment-presets-page)
- [ ] **Must land with v11** · P0 · DOC-F28. Nuxt on Deno: the deno_server preset has no request instrumentation: [Correct the Nuxt Nitro preset page for Deno: keep the node-server preset](#33-correct-the-nuxt-nitro-preset-page-for-deno-keep-the-node-server-preset)
- [ ] **Must land with v11** · P0 · DOC-F13. Astro on Bun: the runtime alert says not supported: [Name Bun in the Astro runtime alert and add a Running on Bun section](#34-name-bun-in-the-astro-runtime-alert-and-add-a-running-on-bun-section)
- [ ] **Must land with v11** · P0 · DOC-F30. Astro on Deno: the runtime alert says not supported: [Correct the Astro runtime note: Deno with @deno/astro-adapter works](#35-correct-the-astro-runtime-note-deno-with-denoastro-adapter-works)
- [ ] **Must land with v11** · P0 · DOC-F29. SvelteKit on Deno: the adapter note says not supported: [Correct the SvelteKit adapter note: adapter-node runs on Deno](#36-correct-the-sveltekit-adapter-note-adapter-node-runs-on-deno)

## Frameworks whose page misses the wiring or the limits

- [ ] **Should land with v11** · P1 · DOC-F1. Hono on Bun: [Document Hono on Bun: unbundled run and the Bun.build plugin variant](#50-document-hono-on-bun-unbundled-run-and-the-bunbuild-plugin-variant)
- [ ] **Should land with v11** · P1 · DOC-F2. Elysia on Bun: [Add a Bun database instrumentation section to the Elysia guide and fix four include statements](#51-add-a-bun-database-instrumentation-section-to-the-elysia-guide-and-fix-four-include-statements)
- [ ] **Should land with v11** · P1 · DOC-F18. Hono on Deno: [Document the verified Hono on Deno setup and its outgoing fetch limit](#65-document-the-verified-hono-on-deno-setup-and-its-outgoing-fetch-limit)
- [ ] **Should land with v11** · P1 · DOC-F35. Hono on Workers: [Document Hono on Cloudflare Workers: compatibility_date and build-time database spans](#78-document-hono-on-cloudflare-workers-compatibility_date-and-build-time-database-spans)
- [ ] **Should land with v11** · P1 · DOC-F44. Next.js on Workers: [Document outgoing fetch and database spans for Next.js on Cloudflare Workers](#86-document-outgoing-fetch-and-database-spans-for-nextjs-on-cloudflare-workers)
- [ ] **Should land with v11** · P1 · DOC-F45. Nuxt on Workers: [Document server route naming for Nuxt on Cloudflare Workers](#87-document-server-route-naming-for-nuxt-on-cloudflare-workers)
- [ ] **Should land with v11** · P1 · DOC-F46. SvelteKit on Workers: [Document route naming and database-span setup for SvelteKit on Cloudflare Workers](#88-document-route-naming-and-database-span-setup-for-sveltekit-on-cloudflare-workers)
- [ ] **Should land with v11** · P1 · DOC-F49. TanStack Start on Workers: no Configure Vite step: [Add a "Configure Vite" step to the TanStack Start on Cloudflare page](#90-add-a-configure-vite-step-to-the-tanstack-start-on-cloudflare-page)

## Not in this list

The 34 framework pages that do not exist yet (DOC-F3 to DOC-F10, DOC-F12, DOC-F14 to DOC-F17, DOC-F20 to DOC-F27, DOC-F31 to DOC-F34, DOC-F37 to DOC-F43, DOC-F48, DOC-F51), the generated integrations tables and the runtime matrix (X3, DOC-R6), the feature pages (D1, bindings, Durable Objects, Workflows, Agents SDK), and the remaining completeness items. They improve coverage after the release and do not block a first setup.

Counts: 44 must, 59 should, 33 later.
