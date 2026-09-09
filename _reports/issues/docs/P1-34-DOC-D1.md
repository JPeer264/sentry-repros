`guides/deno/index.mdx` renders `import * as Sentry from "npm:@sentry/deno"` through the `___SDK_PACKAGE___` placeholder at `:44` and `:66` (the literal specifier is not in the file), and shows two permission flags. It never states that the database, messaging, AI and framework integrations in the default set require the `@sentry/deno/import` hook, nor that the `Deno.serve` and `node:http` server spans work without it. `packages/deno/README.md:60-83` has a version of this section, but its `--import=@sentry/deno/import` form at `:70` does not resolve.

What was observed on deno 2.9.0 and 2.8.3: a first-line `import '@sentry/deno/import';` before `Sentry.init` registers the hook and instruments `mysql.createConnection`. `--import=@sentry/deno/import` fails with `Module not found`; `--import=./node_modules/@sentry/deno/build/import.mjs` registers the hook. Without the hook the SDK installs 39 integrations at `6f2da7483d`, reports no injection and prints nothing. The `deno-mysql` and `deno-pg` e2e apps use the first-line import form, with `nodeModulesDir: "manual"` and an installed `node_modules`. Any dependency that `require()`s a JSON file currently crashes under the hook.

What to change:

- Add an "Enable library instrumentation" step to `guides/deno/index.mdx` with first-line `import '@sentry/deno/import';` as the primary form.
- State that the hook needs the package resolvable from `node_modules`, so `deno.json` has to set `nodeModulesDir` to `"auto"`, or to `"manual"` with an install step, which is what every Deno e2e app does.
- Show the file-path `--import` flag as the alternative; do not show the bare specifier form.
- State that dependencies which `require()` a JSON file fail to import under the hook.
- State which instrumentation works without the hook.

---

_From the runtime docs audit of September 2026, item DOC-D1, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
