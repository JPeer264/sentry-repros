// The base app.config (manual-setup.mdx:246-275) with the `createErrorHandler` options of
// features/error-handler.mdx:46-60: `logErrors: false` and an `extractor` that counts its calls
// and defers to the default extraction.
import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from "@angular/core";
import { provideRouter, Router } from "@angular/router";

import * as Sentry from "@sentry/angular";
import { routes } from "../../app/app.routes";

export const appConfig: ApplicationConfig = {
  providers: [
    // ...
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        logErrors: false,
        extractor: (error, defaultExtractor) => {
          window.__extractorCalls = (window.__extractorCalls ?? 0) + 1;
          return defaultExtractor(error);
        },
      }),
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    provideAppInitializer(() => {
      inject(Sentry.TraceService);
    }),
  ],
};
