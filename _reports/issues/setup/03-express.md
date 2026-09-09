Docs changes for the Express guide that a new user hits between install and the first event on v11, from the runtime docs audit (develop `03aaf42455` and `6f2da7483d`, docs `aebda0ee4`). Each item links to its issue draft in the secret gist (https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21); the reproductions are [`quickstarts/express/`](<https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/express>) in the audit repository.

## Must land

None.

## Should land

- [ ] **P1** · DOC-Q27 · The Express and Connect async verify snippets hang on Express 4 and Connect 3
  `platform-includes/getting-started-verify/javascript.express.mdx:36-47` replaces the `/debug-sentry` route with an `async` handler that throws inside `Sentry.startSpan`. On express 4.22.2 the request never gets a response (the client timed out, status 000) and the error arrives as `auto.node.onunhandledrejection`, not through the Express error path; the request segment reports status `ok` with `http.response.status_code: 200` although nothing was sent. On express 5.2.1 the same snippet answers 500 and the error is captured as `auto.http.express`. The guide names no Express major; the registry's `express` is 5. The Connect include `getting-started-verify/javascript.connect.mdx:36-47` has the same shape and the same result on connect 3.7.0: no response, the error as `auto.node.onunhandledrejection`, and the segment closed with status `ok` when the client gave up (QS-connect, variant no-handler).
  **Change:** Say that the async snippet needs Express 5, or add a `try/catch` that calls `next(err)` so it works on Express 4 and on Connect as well.
  Draft: [Make the async tracing verify snippets work on Express 4 and Connect 3, or state what they need](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#114-make-the-async-tracing-verify-snippets-work-on-express-4-and-connect-3-or-state-what-they-need>)
