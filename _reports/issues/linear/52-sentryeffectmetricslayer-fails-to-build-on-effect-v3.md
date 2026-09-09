# `SentryEffectMetricsLayer` fails to build on Effect v3

Milestone: XPlatform Functionality Gaps
Labels: JavaScript, Bug
Priority: High

`packages/effect/src/metrics.ts:183-193` builds the layer with `Layer.effectDiscard` around `Effect.acquireRelease` and `Effect.forkScoped`, neither of which gets a scope from `effectDiscard`. On `effect@3.22.2` merging the layer fails with `Service not found: effect/Scope`, the program never runs and nothing is sent, so the option takes down the whole app rather than only its metrics; on `effect@4.0.0-rc.112` the same layer builds (DOC-Q75, `results-metrics.json` against `results-v4.json`). The guide prints the layer in its Effect v3 tab.

**Work item.** Give the layer a scope so it works on both majors, and run the Effect suite against v3 and v4 in CI.

**Evidence.** Getting-started reproduction [`quickstarts/effect/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/effect), run in September 2026 against develop `03aaf42455` (package 10.67.0); results in `results-*.json` and the README of each directory.
