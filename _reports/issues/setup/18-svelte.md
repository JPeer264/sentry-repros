Docs changes for the Svelte guide that a new user hits between install and the first event on v11, from the runtime docs audit (develop `03aaf42455` and `6f2da7483d`, docs `aebda0ee4`). Each item links to its issue draft in the secret gist (https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21); the reproductions are [`quickstarts/svelte/`](<https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/svelte>) in the audit repository.

## Must land

- [ ] **P0** · DOC-Q41 · The Svelte v5 verify snippet binds onClick, which compiles to nothing
  `guides/svelte/index.mdx:254-267` (the Svelte v5+ tab) writes the verify button with `onClick={...}` at `:257`, and `:249` says clicking it triggers a frontend error and a performance trace. Svelte 5.57.0 compiles `onClick` into `event("Click", ...)`: the rendered button has only its `id` and `type`, clicking it sends no span and no event, and neither the compiler, dev mode nor the runtime warns. With `onclick`, which the errors tab at `:217` already uses, the same snippet sends the `Example Frontend Span` and the error.
  **Change:** Change `onClick` to `onclick` in the Svelte v5+ tab.
  Draft: [Change onClick to onclick in the Svelte v5 tab of the tracing verify snippet](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#9-change-onclick-to-onclick-in-the-svelte-v5-tab-of-the-tracing-verify-snippet>)

## Should land

- [ ] **P1** · DOC-Q42 · Old span ops, the wrong trackUpdates default and no runes caveat on the component tracking page
  `guides/svelte/features/component-tracking.mdx:68` and `:72` call the spans `ui.svelte.init` and `ui.svelte.update`; the build sends `ui.mount` and `ui.update`, named `<Navbar>`, `<MyAwesomeComponent>` and so on, with origin `auto.ui.svelte`.
  `:55-57` and `:87-89` say `trackUpdates` is optional and defaults to `true`; the shipped default is `false` in both `withSentryConfig` and `trackComponent`, and `withSentryConfig(config)` produced mount spans only, no update span after re-renders.
  `:72-74` describe update spans over the `beforeUpdate` to `afterUpdate` cycle. On Svelte 5 a runes-mode component (`$props`) records no update span even with `trackUpdates: true`: the lifecycle hooks throw, the SDK swallows it and warns `Cannot track component updates ... Svelte 5 in Runes mode` only with `debug: true`; update spans arrived for the legacy-mode component only, and only while a span was active.
  **Change:** Rename the ops to `ui.mount` and `ui.update` and add the `<ComponentName>` span name. State that `trackUpdates` defaults to `false`. Say that on Svelte 5 update spans need legacy-mode components and that runes-mode components are skipped with a debug warning.
  Draft: [Correct the Svelte component tracking page: span ops, the trackUpdates default and the runes-mode limit](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#119-correct-the-svelte-component-tracking-page-span-ops-the-trackupdates-default-and-the-runes-mode-limit>)
