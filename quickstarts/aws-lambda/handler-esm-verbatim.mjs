// docs/platforms/javascript/guides/aws-lambda/index.mdx:48-54 (ESM verify tab), verbatim including the trailing `}));`. Docs name the file index.mjs.
import * as Sentry from "@sentry/aws-serverless";

export const handler = Sentry.wrapHandler(async (event, context) => {
  throw new Error("This is a test error");
}));
