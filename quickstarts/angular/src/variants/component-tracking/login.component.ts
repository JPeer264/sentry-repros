// docs/platforms/javascript/guides/angular/features/component-tracking.mdx:80-94 with the imports
// the snippet lacks (`Input`, `OnChanges`, `SimpleChanges`; see ../component-tracking-verbatim) and
// an input so `ngOnChanges` fires.
import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import * as Sentry from "@sentry/angular";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
})
export class LoginComponent implements OnChanges {
  @Input() attempt = 0;

  @Sentry.TraceMethod({ name: "Login.ngOnChanges" })
  ngOnChanges(changes: SimpleChanges) {
    // ...
  }
}
