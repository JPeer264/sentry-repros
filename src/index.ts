import * as Sentry from '@sentry/node';
import type { DataCollection } from '@sentry/core';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: {
      request: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
      response: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
    },
    httpBodies: [],
    urlQueryParams: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    graphQL: { document: false, variables: false },
    mcp: { inputs: false, outputs: false },
    queues: false,
    stackFrameVariables: false,
    frameContextLines: 0,
  } satisfies Required<DataCollection>,
});
