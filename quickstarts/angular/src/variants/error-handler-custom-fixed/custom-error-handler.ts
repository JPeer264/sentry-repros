// docs/platforms/javascript/guides/angular/features/error-handler.mdx:67-82 with the `override`
// modifier that the strict `ng new` tsconfig (`noImplicitOverride: true`) requires; see
// ../error-handler-custom for the snippet as printed.
import * as Sentry from "@sentry/angular";

export class CustomErrorHandler extends Sentry.SentryErrorHandler {
  constructor() {
    // Pass options to Sentry's ErrorHandler here. For Example:
    super({ logErrors: false });
  }

  override handleError(error: any): void {
    // Your custom error handling logic
    // Call Sentry's error handler to capture errors:
    super.handleError(error);
  }
}
