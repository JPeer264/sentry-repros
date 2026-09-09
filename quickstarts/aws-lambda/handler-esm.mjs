// docs/platforms/javascript/guides/aws-lambda/index.mdx:48-54 (ESM verify tab) with the stray `)` removed so it parses.
import * as Sentry from "@sentry/aws-serverless";

export const handler = Sentry.wrapHandler(async (event, context) => {
  throw new Error("This is a test error");
});
