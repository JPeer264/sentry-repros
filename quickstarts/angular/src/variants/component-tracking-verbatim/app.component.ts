// A root that mounts the two component-tracking.mdx snippets as printed (login.component.ts :80-94,
// user-card.component.ts :106-122, user-card.component.html :126-133). Build probe only.
import { Component } from "@angular/core";
import { markWired } from "../../harness";
import { LoginComponent } from "./login.component";
import { UserCardComponent } from "./user-card.component";

@Component({
  selector: "app-root",
  imports: [LoginComponent, UserCardComponent],
  template: `<app-login></app-login><app-user-card></app-user-card>`,
})
export class AppComponent {
  constructor() {
    markWired();
  }
}
