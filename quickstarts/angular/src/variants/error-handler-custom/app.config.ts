// The base app.config (manual-setup.mdx:246-275) with the ErrorHandler provider pointing at the
// `CustomErrorHandler` of features/error-handler.mdx:67-82. The page does not show how to register
// the subclass; `useClass` is the natural form for a class.
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
import { CustomErrorHandler } from "./custom-error-handler";

export const appConfig: ApplicationConfig = {
  providers: [
    // ...
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: ErrorHandler,
      useClass: CustomErrorHandler,
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
