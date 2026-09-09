// docs/platforms/javascript/guides/angular/features/error-handler.mdx:67-82 ("Multiple Error
// Handlers") verbatim.
import * as Sentry from "@sentry/angular";

export class CustomErrorHandler extends Sentry.SentryErrorHandler {
  constructor() {
    // Pass options to Sentry's ErrorHandler here. For Example:
    super({ logErrors: false });
  }

  handleError(error: any): void {
    // Your custom error handling logic
    // Call Sentry's error handler to capture errors:
    super.handleError(error);
  }
}
