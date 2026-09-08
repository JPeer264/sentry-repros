# Dedupe drops repeated errors across requests with the cached client

Milestone: CF Functionality Gaps
Labels: JavaScript, Cloudflare Workers, Bug
Priority: Medium

On develop the client is cached per isolate. The Dedupe integration then treats an identical error thrown in a later request as a duplicate: hitting the same failing route twice sends one event, and the second arrives only after a different event goes out. `enableDedupe: false` turns it off. On 10.73.0, with a client per request, every hit produced an event.

**Work item.** Reset the dedupe state per request, or leave Dedupe out of the Cloudflare defaults when the client is cached.

**Evidence.** Cloudflare section of the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html) (develop regression) and the [quick start verification](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/quick-starts.html).
