// docs/platforms/javascript/guides/angular/manual-setup.mdx:398-411 (the verify button and
// `throwTestError()`) and :432-449 (the tracing version of the same method, kept as
// `throwTestErrorWithSpan()` so both snippets stay verbatim), plus the logs include
// (includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:12-24) behind `#btn-log` and a
// propagation probe behind `#btn-fetch`. The nav links and the outlet stand in for the
// `<!-- rest of your page -->`.
import { Component } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";
import * as Sentry from "@sentry/angular";
import { markWired } from "../harness";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, RouterLink],
  template: `
      <!-- rest of your page -->
      <nav>
        <a id="nav-home" routerLink="/">home</a>
        <a id="nav-plain" routerLink="/plain/5">plain</a>
        <a id="nav-user" routerLink="/users/7">user</a>
      </nav>
      <button id="btn-throw" (click)="throwTestError()">Test Sentry Error</button>
      <button id="btn-span" (click)="throwTestErrorWithSpan()">Test Sentry Error (span)</button>
      <button id="btn-log" (click)="log()">Logs</button>
      <button id="btn-fetch" (click)="fetchProbe()">Fetch</button>
      <router-outlet />`,
})
export class AppComponent {
  constructor() {
    markWired();
  }

  // ...
  throwTestError(): void {
      throw new Error("Sentry Test Error");
  }

  throwTestErrorWithSpan(): void {
    Sentry.startSpan({ op: "test", name: "Example Span" }, () => {
      setTimeout(() => {
        throw new Error("Sentry Test Error");
      }, 99);
    });
  }

  log(): void {
    Sentry.logger.info("User example action completed");

    Sentry.logger.warn("Slow operation detected", {
      operation: "data_fetch",
      duration: 3500,
    });

    Sentry.logger.error("Validation failed", {
      field: "email",
      reason: "Invalid email",
    });
  }

  fetchProbe(): void {
    fetch("/recorder?from=relative");
    fetch(`${location.origin}/recorder?from=absolute`);
  }
}
