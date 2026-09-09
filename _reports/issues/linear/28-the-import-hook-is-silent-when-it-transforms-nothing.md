# The import hook is silent when it transforms nothing

Milestone: Deno Functionality Gaps
Labels: JavaScript, Deno, Improvement
Priority: Medium

Three cases end with no instrumentation and no message. The hook needs the package resolvable from a local `node_modules`, so `deno.json` has to set `nodeModulesDir` to `"auto"`, or to `"manual"` with an install step, which is what every Deno e2e app and every cell in this audit does; without one nothing is injected. Without `--allow-env` the first-line import crashes with `NotCapable: Requires env access` before `Sentry.init` runs. The `--import=@sentry/deno/import` form shown in the package README is resolved as a file path and rejected with `Module not found`; only the first-line import or `--import=./node_modules/@sentry/deno/build/import.mjs` registers the hook. `init()` itself never warns when the hook is absent (#23892).

**Work item.** One diagnostic path: warn at init when no injection happened, say why when it can be known (package not resolvable from `node_modules`, hook not registered), and accept the bare specifier or fix the README.

**Evidence.** Probe record D02 in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`probes/D02/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/probes/D02). First-round probe D-HOOK, see the code-defects table in the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
