Docs changes for the AWS Lambda guide that a new user hits between install and the first event on v11, from the runtime docs audit (develop `03aaf42455` and `6f2da7483d`, docs `aebda0ee4`). Each item links to its issue draft in the secret gist (https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21); the reproductions are [`quickstarts/aws-lambda/`](<https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/aws-lambda>) in the audit repository.

## Must land

- [ ] **P0** · DOC-Q71 · Two snippets do not parse: a stray parenthesis and Promise.rejected
  `guides/aws-lambda/index.mdx:48-54`, the ESM verify tab, ends the handler with `}));`, one `)` too many: loading the file gives `SyntaxError: Unexpected token ')'`, captured through `onuncaughtexception`, and no span. With `});` the handler works. `guides/aws-lambda/configuration/lambda-wrapper.mdx:51-52` calls `Promise.rejected(...)` twice inside `Promise.allSettled`: `TypeError: Promise.rejected is not a function`.
  **Change:** Change `}));` to `});` and `Promise.rejected` to `Promise.reject`.
  Draft: [Fix the stray parenthesis in the AWS Lambda ESM verify handler and Promise.rejected on the wrapper page](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#16-fix-the-stray-parenthesis-in-the-aws-lambda-esm-verify-handler-and-promiserejected-on-the-wrapper-page>)

## Should land

- [ ] **P1** · DOC-Q72 · The ESM tab creates instrument.mjs and the load step imports instrument.js
  `guides/aws-lambda/install/npm.mdx:125` (and `install/layer.mdx:88`) creates `instrument.mjs` in the ESM tab, and the load step at `npm.mdx:161` (`layer.mdx:111`) says `NODE_OPTIONS="--import ./instrument.js"`. With only `instrument.mjs` present the preload fails with `ERR_MODULE_NOT_FOUND` and the function never starts; `--import ./instrument.mjs` works.
  **Change:** Give the load step CommonJS and ESM tabs with `--import ./instrument.js` and `--import ./instrument.mjs`.
  Draft: [Give the AWS Lambda load step the file name its ESM tab creates](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#134-give-the-aws-lambda-load-step-the-file-name-its-esm-tab-creates>)
- [ ] **P1** · DOC-Q73 · The wrapper options are overridden by the v11 automatic wrapping
  `guides/aws-lambda/configuration/lambda-wrapper.mdx:13-37` says timeout warnings, `flushTimeout` and `timeoutWarningLimit` are set through the `wrapHandler` options. On develop `awsLambdaIntegration` rewrites `_HANDLER` to a shim that wraps the exported handler with default options: with `captureTimeoutWarning: false` on the user's `wrapHandler` a `Possible function timeout` warning event still arrived. `wrapHandler` in user code is redundant for both install options and only changes the mechanism to `auto.function.aws_serverless.handler`; on its own, without the runtime redirect, it yields an error event but no span.
  **Change:** State that the automatic instrumentation applies default wrapper options, and document how to opt out of `awsLambdaIntegration` so the `wrapHandler` options take effect.
  Draft: [Say on the Lambda wrapper page that v11 wraps the handler automatically with default options](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#135-say-on-the-lambda-wrapper-page-that-v11-wraps-the-handler-automatically-with-default-options>)
