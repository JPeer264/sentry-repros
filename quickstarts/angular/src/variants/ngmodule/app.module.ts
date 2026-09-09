// docs/platforms/javascript/guides/angular/manual-setup.mdx:310-339 (the "NGModule Config" tab of
// app.module.ts). The `// ...` lines are filled with a module root component that renders the
// shared standalone `AppComponent`, `BrowserModule` and `RouterModule.forRoot(routes)`.
import { APP_INITIALIZER, Component, ErrorHandler, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { Router, RouterModule } from "@angular/router";

import * as Sentry from "@sentry/angular";
import { AppComponent } from "../../app/app.component";
import { routes } from "../../app/app.routes";

@Component({ selector: "app-ng-root", standalone: false, template: "<app-root></app-root>" })
export class NgRootComponent {}

@NgModule({
  // ...
  declarations: [NgRootComponent],
  imports: [BrowserModule, RouterModule.forRoot(routes), AppComponent],
  bootstrap: [NgRootComponent],
  providers: [
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
  // ...
})
export class AppModule {}
