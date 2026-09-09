// docs/platforms/javascript/guides/angular/manual-setup.mdx:246-275 (the "App Config (Angular 19+)"
// tab of app.config.ts) as printed: `inject(TraceService)` with no `TraceService` import. Only the
// `// ...` is filled with what `ng new` puts there (`provideBrowserGlobalErrorListeners()`,
// `provideRouter(routes)`).
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
      useValue: Sentry.createErrorHandler(),
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    provideAppInitializer(() => {
      inject(TraceService);
    }),
  ],
};
