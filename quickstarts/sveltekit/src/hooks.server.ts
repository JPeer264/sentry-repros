// getting-started-complete/javascript.sveltekit.mdx:272-286 verbatim.
import * as Sentry from "@sentry/sveltekit";

const myErrorHandler = ({ error, event }) => {
  console.error("An error occurred on the server side:", error, event);
};

export const handleError = Sentry.handleErrorWithSentry(myErrorHandler);
// or alternatively, if you don't have a custom error handler:
// export const handleError = handleErrorWithSentry();

export const handle = Sentry.sentryHandle();
// Or use `sequence` if you're using your own handler(s):
// export const handle = sequence(Sentry.sentryHandle(), yourHandler());
