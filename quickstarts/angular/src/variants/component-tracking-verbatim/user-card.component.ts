// docs/platforms/javascript/guides/angular/features/component-tracking.mdx:106-122 verbatim.
import { Component, OnInit } from "@angular/core";
import * as Sentry from "@sentry/angular";

@Component({
  selector: "app-user-card",
  templateUrl: "./user-card.component.html",
})
@Sentry.TraceClass()
export class UserCardComponent implements OnChanges, OnDestroy {
  @Sentry.TraceMethod()
  ngOnChanges(changes: SimpleChanges) {}

  @Sentry.TraceMethod()
  ngOnDestroy() {}
}
