// Route components, not part of any docs snippet. They stand in for the `// rest of your page`.
import { Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";
import { map } from "rxjs";

@Component({ selector: "app-home", template: `<h1 id="home">home</h1>` })
export class HomeComponent {}

@Component({ selector: "app-user", template: `<h1>user <span id="user-id">{{ id() }}</span></h1>` })
export class UserComponent {
  id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get("id"))));
}

@Component({ selector: "app-plain", template: `<h1 id="plain">plain {{ id() }}</h1>` })
export class PlainComponent {
  id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get("id"))));
}
