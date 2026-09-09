Docs changes for the Solid guide that a new user hits between install and the first event on v11, from the runtime docs audit (develop `03aaf42455` and `6f2da7483d`, docs `aebda0ee4`). Each item links to its issue draft in the secret gist (https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21); the reproductions are [`quickstarts/solid/`](<https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/solid>) in the audit repository.

## Must land

- [ ] **P0** · DOC-Q48 · The tracing snippet needs @solidjs/router, which the guide never installs
  `guides/solid/index.mdx:31` installs `@sentry/solid` only, and the `index.jsx` snippet with the performance option (`:76`, `:89`) imports `solidRouterBrowserTracingIntegration` from `@sentry/solid/solidrouter`. That module imports `@solidjs/router`, an optional peer: without Solid Router installed the build fails with `Could not resolve "@solidjs/router"`. With the router installed the snippet builds and runs.
  **Change:** Say that the performance snippet requires `@solidjs/router`, and show `Sentry.browserTracingIntegration()` for apps without Solid Router.
  Draft: [State on the Solid guide that the tracing snippet requires @solidjs/router](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#11-state-on-the-solid-guide-that-the-tracing-snippet-requires-solidjsrouter>)

## Should land

- [ ] **P1** · DOC-Q49 · The DEV guard skips init under vite dev, so the verify step sends nothing
  `guides/solid/index.mdx:79-80` wraps `Sentry.init` in `if (!DEV)`, and the verify step at `:173-179` and `:207-210` tells the reader to open the page and click the button. Under the development export condition (a Vite dev server) `DEV` is truthy, `Sentry.init` never runs, `getClient()` is undefined and the clicks send nothing; the boundary fallback renders without capture. A production build sends both verify errors, the boundary error, logs, replay and the trace.
  **Change:** Say in the verify step that the guard means a production build (`vite build` plus `vite preview`) is needed, or drop the guard for the verify step.
  Draft: [Say on the Solid guide that the verify step needs a production build because of the DEV guard](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#123-say-on-the-solid-guide-that-the-verify-step-needs-a-production-build-because-of-the-dev-guard>)
- [ ] **P1** · DOC-Q50 · No navigation spans without withSentryRouterRouting
  `guides/solid/index.mdx:76` and `:89` add `solidRouterBrowserTracingIntegration()` and present that as the tracing setup. The integration forces `instrumentNavigation: false` and creates navigation spans only through `withSentryRouterRouting`, which the guide never mentions: around a plain `<Router>` two route changes produced zero navigation spans and both pageloads were named `Pageload` with source `url`; with the wrapped Router (`features/solid-router.mdx:20-45`) the pageload is `/router/users/:id` with source `route` and navigations carry `params.id`.
  **Change:** Add the `withSentryRouterRouting(Router)` line next to the integration in the init snippet, or link the Solid Router feature page there.
  Draft: [Add withSentryRouterRouting to the Solid guide's tracing snippet](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#124-add-withsentryrouterrouting-to-the-solid-guides-tracing-snippet>)
