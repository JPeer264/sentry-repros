# Svelte 5 runes-mode components get no update spans

Milestone: XPlatform Functionality Gaps
Labels: JavaScript, Bug
Priority: Low

`trackUpdates` is implemented with `beforeUpdate` and `afterUpdate`, which throw in a Svelte 5 runes-mode component. The SDK swallows the throw and warns `Cannot track component updates. This is likely because you're using Svelte 5 in Runes mode.` only under `debug: true`, so a runes app with `trackUpdates: true` records the `ui.mount` span, no `ui.update` span ever, and nothing at the default log level says why; the legacy-mode component in the same run got its update spans (DOC-Q42, `results-track-component.json`). Runes are what a new Svelte 5 app is written in.

**Work item.** Track updates through a runes-compatible hook, or warn at the default log level and state the limit in the option's JSDoc.

**Evidence.** Getting-started reproduction [`quickstarts/svelte/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/svelte), run in September 2026 against develop `03aaf42455` (package 10.67.0); results in `results-*.json` and the README of each directory.
