// docs/platforms/javascript/guides/angular/features/component-tracking.mdx:106-122 with the imports
// the snippet lacks (`Input`, `OnChanges`, `OnDestroy`, `SimpleChanges`; see
// ../component-tracking-verbatim), the `user` input its template reads, and the `imports` for the
// `trace` directive and the two child components its template (:126-133) uses.
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from "@angular/core";
import * as Sentry from "@sentry/angular";
import { ButtonComponent, IconComponent } from "./parts";

@Component({
  selector: "app-user-card",
  templateUrl: "./user-card.component.html",
  imports: [Sentry.TraceModule, IconComponent, ButtonComponent],
})
@Sentry.TraceClass()
export class UserCardComponent implements OnChanges, OnDestroy {
  @Input() user = { name: "" };

  @Sentry.TraceMethod()
  ngOnChanges(changes: SimpleChanges) {}

  @Sentry.TraceMethod()
  ngOnDestroy() {}
}
