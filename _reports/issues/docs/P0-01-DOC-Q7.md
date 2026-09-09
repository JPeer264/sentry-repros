**Filed.** Must item of Linear [SDK-1503](https://linear.app/getsentry/issue/SDK-1503), "Browser (Getting started / Manual setup)".

`platform-includes/getting-started-verify/javascript.mdx:53-68` tells the reader to update the button handler so that it starts a span around a simulated longer operation, and shows `function triggerError() { await Sentry.startSpan(...) }`. The function is not `async`.

Observed with the snippet copied verbatim into a page: Chrome reports `Uncaught SyntaxError: await is only valid in async functions and the top level bodies of modules`, discards the whole script block, and the "Break the World" button next to it throws `ReferenceError`. With `async function triggerError()` the same page produces the span (`test Example Frontend Span`) inside the pageload span envelope.

What to change:

- Make the handler `async function triggerError()` in the snippet, and keep the button call as it is.
- Say what arrives: one span envelope with the pageload segment and the manual span as a child, no transaction envelope, because the default lifecycle is stream (DOC-Q1).

---

_From the runtime docs audit of September 2026, item DOC-Q7, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
