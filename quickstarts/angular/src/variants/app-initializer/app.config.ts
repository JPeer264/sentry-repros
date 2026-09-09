// docs/platforms/javascript/guides/angular/manual-setup.mdx:277-308 (the "App Config (Angular <=18)"
// tab of app.config.ts, the `APP_INITIALIZER` form) on Angular 22. The `// ...` stands for what
// `ng new` puts there: `provideBrowserGlobalErrorListeners()` and `provideRouter(routes)`.
import {
  APP_INITIALIZER,
  ApplicationConfig,
  ErrorHandler,
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
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [Sentry.TraceService],
      multi: true,
    },
  ],
};
