// docs/platforms/javascript/guides/angular/features/component-tracking.mdx:80-94 verbatim.
import { Component, OnInit } from "@angular/core";
import * as Sentry from "@sentry/angular";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
})
export class LoginComponent implements OnChanges {
  @Sentry.TraceMethod({ name: "Login.ngOnChanges" })
  ngOnChanges(changes: SimpleChanges) {
    // ...
  }
}
