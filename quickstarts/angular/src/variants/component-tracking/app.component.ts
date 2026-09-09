// docs/platforms/javascript/guides/angular/features/component-tracking.mdx:22-34 (the standalone
// `AppComponent` importing `Sentry.TraceModule`) with the template of :48-52 (`trace="header"`,
// `trace="articles-list"`, `trace="footer"`), plus the `app-login` of :80-94 (an input so
// `ngOnChanges` fires), the `app-user-card` of :106-133 (toggled off so `ngOnDestroy` fires) and
// two buttons for the driver.
import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import * as Sentry from "@sentry/angular";
import { markWired } from "../../harness";
import { HeaderComponent } from "./header.component";
import { LoginComponent } from "./login.component";
import { ArticlesListComponent, FooterComponent } from "./parts";
import { UserCardComponent } from "./user-card.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [Sentry.TraceModule, RouterOutlet, HeaderComponent, ArticlesListComponent, FooterComponent, LoginComponent, UserCardComponent],
  template: `
<app-header trace="header"></app-header>
<articles-list trace="articles-list"></articles-list>
<app-footer trace="footer"></app-footer>
<app-login [attempt]="attempt"></app-login>
@if (showCard) {
  <app-user-card [user]="user"></app-user-card>
}
<button id="btn-change" (click)="attempt = attempt + 1">change</button>
<button id="btn-destroy" (click)="showCard = false">destroy</button>
<span id="attempt">{{ attempt }}</span>
<router-outlet />`,
})
export class AppComponent {
  attempt = 0;
  showCard = true;
  user = { name: "Ada" };

  constructor() {
    markWired();
  }
}
