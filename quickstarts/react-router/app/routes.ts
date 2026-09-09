import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("users/:id", "routes/users.$id.tsx"),
  route("error", "routes/error.tsx"),
  route("error-tracing", "routes/error-tracing.tsx"),
  route("action-error", "routes/action-error.tsx"),
  route("api/recorder", "routes/api.recorder.ts"),
  route("api/sentinel", "routes/api.sentinel.ts"),
] satisfies RouteConfig;
