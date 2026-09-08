import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("fetchout", "routes/fetchout.tsx"),
  route("flush", "routes/flush.tsx"),
] satisfies RouteConfig;
