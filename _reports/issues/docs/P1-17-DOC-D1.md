`guides/deno/index.mdx` shows `import * as Sentry from "npm:@sentry/deno"` and two permission flags. It never states that the database, messaging, AI and framework integrations in the default set require the `@sentry/deno/import` hook, nor that the `Deno.serve` and `node:http` server spans work without it. `packages/deno/README.md:60-83` has a version of this section, but its `--import=@sentry/deno/import` form does not resolve.

What was observed on deno 2.9.0 and 2.8.3: a first-line `import '@sentry/deno/import';` before `Sentry.init` registers the hook and instruments `mysql.createConnection`. `--import=@sentry/deno/import` fails with `Module not found`; `--import=./node_modules/@sentry/deno/build/import.mjs` registers the hook. Without the hook the SDK installs 39 integrations, reports no injection and prints nothing. The `deno-mysql` and `deno-pg` e2e apps use the first-line import form. Any dependency that `require()`s a JSON file currently crashes under the hook.

What to change:

- Add an "Enable library instrumentation" step to `guides/deno/index.mdx` with first-line `import '@sentry/deno/import';` as the primary form and `nodeModulesDir: "auto"` in `deno.json`.
- Show the file-path `--import` flag as the alternative; do not show the bare specifier form.
- State that dependencies which `require()` a JSON file fail to import under the hook.
- State which instrumentation works without the hook.

---

_From the runtime docs audit of September 2026, item DOC-D1, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
