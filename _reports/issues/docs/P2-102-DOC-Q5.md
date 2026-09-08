`platform-includes/getting-started-node/javascript.mdx:93-96` shows `node --import ./instrument.mjs app.mjs`, and `:55` warns that importing the instrument file later than first means auto-instrumentation and modules like database monitoring may not work. Nothing on the page mentions `--require`.

Observed on `develop` with Node v26.5.0: `node --require ./instrument.cjs app.mjs` still delivers the same errors, spans, headers and logs, but its first stderr line is `[Sentry] Initializing the SDK via the Node --require flag is no longer supported, because Node re-runs --require preloads on its module loader thread. Use --import instead`, printed from `packages/node/src/sdk/index.ts:126-133` whenever `getEntryPointType() === 'require'`, unconditionally and not behind `debug`. A first-line `import "./instrument.mjs"` in the entry file gives the same telemetry as the flag, including Express route names and handler spans, because the injection hook is registered while `@sentry/node` evaluates. `NODE_OPTIONS="--import ./instrument.mjs"` is identical to the flag.

What to change:

- Add one sentence that `--require` is no longer supported for initializing the SDK and prints a banner, with the `--import` replacement. Keep it narrow: `common/install/late-initialization.mdx:34,37,106,132` recommends `node --require @sentry/node/preload app.js`, which is the preload hook rather than init and stays correct.
- Soften the ordering warning at `:55`: a first-line ESM import of the instrument file is equivalent to `--import`; the warning applies to imports that are not first.
- Surface `NODE_OPTIONS` as an equivalent form on this page; it is already documented at `common/install/esm.mdx:44-48`.

---

_From the runtime docs audit of September 2026, item DOC-Q5, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
