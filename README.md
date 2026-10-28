# Reproduction for getsentry/sentry-javascript#25474

A Node app creates two named node-schedule jobs with the schedule `0 9 * * *`: one with `schedule.scheduleJob(name, spec, fn)`, and one with `new schedule.Job(name, fn)` and `job.schedule(spec)`. The node-schedule README documents both. With `nodeScheduleIntegration` from PR #25474, only the `scheduleJob` job sends check-ins. The `new Job` job runs, but the SDK sends no check-in for it, so Sentry cannot create its monitor.

## Getting started

The repro needs a local build of PR #25474. In the PR checkout, build `@sentry/node`, and publish it and its `@sentry/*` dependencies to yalc:

```
$ pnpm run build:dev:filter @sentry/node
$ for p in core opentelemetry server-utils server-runtime-injection bundler-plugins node; do (cd packages/$p && yalc publish --sig); done
```

Then, in this repro:

```
$ yalc add @sentry/core@11.8.0 @sentry/opentelemetry@11.8.0 @sentry/server-utils@11.8.0 @sentry/server-runtime-injection@11.8.0 @sentry/bundler-plugins@11.8.0 @sentry/node@11.8.0 --pure
$ pnpm i
```

`pnpm-workspace.yaml` points the `@sentry/*` packages to `.yalc/`.

## Running

```
$ USE_INTEGRATION=1 pnpm start
SENTRY_DSN is not set, so the check-ins are only printed, not sent.
SDK sends  schedule-job   in_progress  config "0 9 * * *"
job ran    schedule-job
SDK sends  schedule-job   ok
job ran    new-job
```

- `USE_INTEGRATION=1 pnpm start` uses `nodeScheduleIntegration`.
- `pnpm start` uses `Sentry.cron.instrumentNodeSchedule`. The output is the same, also with the released `@sentry/node` 11.9.0, because the wrapper only changes `scheduleJob`.
- With `SENTRY_DSN=<your DSN>`, the check-ins also go to Sentry.

Tested with PR #25474 (0af113c30c) and `@sentry/node` 11.9.0, node-schedule 2.1.1, Node 22.23.4 and 24.22.1, pnpm 12.3.4.
