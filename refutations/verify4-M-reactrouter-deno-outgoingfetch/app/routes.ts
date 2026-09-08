import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('fetchout', 'routes/fetchout.tsx'),
  route('httpout', 'routes/httpout.tsx'),
  route('undicifetch', 'routes/undicifetch.tsx'),
  route('sentinel', 'routes/sentinel.tsx'),
] satisfies RouteConfig;
