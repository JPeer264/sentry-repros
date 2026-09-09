import { Routes } from "@angular/router";
import { HomeComponent, PlainComponent, UserComponent } from "./pages";

export const routes: Routes = [
  { path: "", component: HomeComponent },
  { path: "users/:id", component: UserComponent },
  { path: "plain/:id", component: PlainComponent },
];
