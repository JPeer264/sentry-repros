// docs/platforms/javascript/guides/aws-lambda/configuration/lambda-wrapper.mdx:15-19 and :25-29 (flushTimeout, captureTimeoutWarning) applied
// to a handler that takes 300 ms; run with LAMBDA_REMAINING_MS=600 so a timeout warning would fire 100 ms in.
import * as Sentry from "@sentry/aws-serverless";

const yourHandler = async (event, context) => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { statusCode: 200, body: "ok" };
};

export const handler = Sentry.wrapHandler(yourHandler, {
  flushTimeout: 1000,
  captureTimeoutWarning: false,
});
