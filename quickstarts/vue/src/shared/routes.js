// The "..." of the guide's `createRouter({ // ... })` and `createApp({ // ... })`: three routes
// (one named with a param, one named, one unnamed with a param) and a root component with links.
import { createWebHistory } from "vue-router";
import { VerifyButtons } from "./VerifyButtons";

const HomeView = { name: "HomeView", template: `<div id="home">home</div>` };
const UserView = { name: "UserView", props: ["id"], template: `<div>user <span id="user-id">{{ id }}</span></div>` };
const PlainView = { name: "PlainView", template: `<div id="plain">plain {{ $route.params.id }}</div>` };

export const routerOptions = {
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: HomeView },
    { path: "/users/:id", name: "user", component: UserView, props: true },
    { path: "/plain/:id", component: PlainView },
  ],
};

export const RootApp = {
  name: "App",
  components: { VerifyButtons },
  template: `<div>
    <nav>
      <router-link id="nav-home" to="/">home</router-link>
      <router-link id="nav-user" to="/users/7">user</router-link>
      <router-link id="nav-plain" to="/plain/5">plain</router-link>
    </nav>
    <router-view />
    <VerifyButtons />
  </div>`,
};
