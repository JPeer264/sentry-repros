Docs changes for the Vue guide that a new user hits between install and the first event on v11, from the runtime docs audit (develop `03aaf42455` and `6f2da7483d`, docs `aebda0ee4`). Each item links to its issue draft in the secret gist (https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21); the reproductions are [`quickstarts/vue/`](<https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/vue>) in the audit repository.

## Must land

- [ ] **P0** · DOC-Q19 · The Vue Router page's only full example is Vue 2 code that fails on Vue 3
  `guides/vue/features/vue-router.mdx:8` says the routing instrumentation supports vue-router v2, v3 and v4, and the page's one full example at `:13-43` is Vue 2 code: `import Vue from "vue"` (`:14`), `import Router from "vue-router"` (`:17`), `Vue.use(Router)` (`:22`), `new Router` (`:24`), `new Vue` (`:37`).
  Observed on the guide's own Vue 3 install (vue 3.5.42, vue-router 4.6.4): the snippet does not build, esbuild reports `No matching export for import default` for both imports. The guide's init at `guides/vue/index.mdx:71-126` with `browserTracingIntegration({ router })` works, and `routeLabel: "path"` gives `/users/:id` segments with source `route`.
  **Change:** Add a Vue 3 tab (`createApp`, `createRouter`, `Sentry.init({ app, integrations: [Sentry.browserTracingIntegration({ router })] })`) next to the Vue 2 one, or lead with it.
  Draft: [Add a Vue 3 example to the Vue Router instrumentation page](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#3-add-a-vue-3-example-to-the-vue-router-instrumentation-page>)
- [ ] **P0** · DOC-Q20 · The tracingOptions.hooks snippet is a syntax error
  `guides/vue/features/component-tracking.mdx:56-69` has no comma after `trackComponents: true` (`:63`). Copied verbatim, esbuild stops with `Expected "}" but found "hooks"`. With the comma added the snippet works: `ui.mount` for every component, five `ui.update` spans and `ui.unmount` for the removed component, all under the pageload segment.
  **Change:** Add the comma.
  Draft: [Add the missing comma to the tracingOptions.hooks snippet on the Vue component tracking page](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#4-add-the-missing-comma-to-the-tracingoptionshooks-snippet-on-the-vue-component-tracking-page>)

## Should land

- [ ] **P1** · DOC-Q21 · Wrong default hooks, wrong span ops and a duplicate-key snippet on the component tracking page
  `guides/vue/features/component-tracking.mdx:71` says the default set of tracked hooks is `['activate', 'mount', 'update']`. The develop build's `DEFAULT_HOOKS` is `['activate', 'mount']` (`build/esm/constants.js`); two prop updates produced no `ui.update` span until `hooks` was passed, and `hooks` is additive, `mount` cannot be turned off.
  `:19-23` names the ops `ui.vue.render` and `ui.vue.[hook]`. Observed: `ui.render` named `Application Render`, and `ui.mount`, `ui.update`, `ui.unmount` named `Vue <Name>` plus `Vue <Root>`. Only the v10-to-v11 page (`common/migration/v10-to-v11/index.mdx:454`) records the rename.
  `:28-48` puts `trackComponents: true` and the component-name array in one object literal as an "or"; as printed the array wins, esbuild warns `Duplicate key trackComponents`, and the untracked component gets no span.
  **Change:** State the default as `['activate', 'mount']` and say `hooks` adds to it. Rename the ops and add the span names. Split the boolean and the array form into two snippets.
  Draft: [Correct the Vue component tracking page: default hooks, span ops and the duplicate-key snippet](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#113-correct-the-vue-component-tracking-page-default-hooks-span-ops-and-the-duplicate-key-snippet>)
