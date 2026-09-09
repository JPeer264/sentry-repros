// docs/platforms/javascript/guides/angular/features/component-tracking.mdx:60-72 verbatim.
import { Component } from "@angular/core";
import * as Sentry from "@sentry/angular";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
})
@Sentry.TraceClass({ name: "Header" })
export class HeaderComponent {
  // ...
}
