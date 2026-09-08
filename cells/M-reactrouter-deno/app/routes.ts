import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('users/:id', 'routes/users.$id.tsx'),
  route('boom', 'routes/boom.tsx'),
  route('iso/:tag', 'routes/iso.$tag.tsx'),
  route('fetchout', 'routes/fetchout.tsx'),
  route('httpout', 'routes/httpout.tsx'),
  route('db', 'routes/db.tsx'),
  route('logs', 'routes/logs.tsx'),
  route('sentinel', 'routes/sentinel.tsx'),
] satisfies RouteConfig;
