// docs/platforms/javascript/guides/angular/manual-setup.mdx:246-275 (the "App Config (Angular 19+)"
// tab of app.config.ts). The snippet's `inject(TraceService)` (:270) does not compile because
// `TraceService` is never imported (see ../app-config-verbatim); this copy uses
// `inject(Sentry.TraceService)`. The `// ...` stands for what `ng new` puts there:
// `provideBrowserGlobalErrorListeners()` and `provideRouter(routes)`.
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
      inject(Sentry.TraceService);
    }),
  ],
};
