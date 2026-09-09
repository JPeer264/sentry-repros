// configuration/ember-options.mdx:43-54: the default export wrapped with instrumentRoutePerformance.
import Route from "@ember/routing/route";
import { instrumentRoutePerformance } from "@sentry/ember";

class UserRoute extends Route {
  model(params) {
    return new Promise((resolve) => setTimeout(() => resolve({ id: params.user_id }), 20));
  }
}

export default instrumentRoutePerformance(UserRoute);
