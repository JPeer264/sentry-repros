Docs changes for the Azure Functions guide that a new user hits between install and the first event on v11, from the runtime docs audit (develop `03aaf42455` and `6f2da7483d`, docs `aebda0ee4`). Each item links to its issue draft in the secret gist (https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21); the reproductions are [`quickstarts/azure-functions/`](<https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/quickstarts/azure-functions>) in the audit repository.

## Must land

None.

## Should land

- [ ] **P1** · DOC-Q81 · Request data attached with a metadata key the SDK never reads
  `guides/azure-functions/index.mdx:112-115` and `:160` enrich the event with `scope.setSDKProcessingMetadata({ request: req })`. The captured event has no `request` and no `user` in every variant, with the v3 and the v4 programming model: the RequestData integration reads `sdkProcessingMetadata.normalizedRequest` only, and the metadata type's index signature lets `{ request: req }` type-check while it is ignored. With `{ normalizedRequest: { url, method, headers, query_string, data } }` the same file yields `event.request` and `user.ip_address` from `x-forwarded-for` under the default `dataCollection`. The comment at `:114` says the request context requires `dataCollection: { userInfo: true }`; that option defaults to true and governs the user fields only.
  **Change:** Replace `{ request: req }` with a `normalizedRequest` object in both snippets, and drop the `userInfo` comment or say that the IP is sent by default and can be turned off.
  Draft: [Use normalizedRequest in the Azure Functions request-context snippets](<https://gist.github.com/JPeer264/6d973a8266700d0cecbca9ed27cf8b21#138-use-normalizedrequest-in-the-azure-functions-request-context-snippets>)
