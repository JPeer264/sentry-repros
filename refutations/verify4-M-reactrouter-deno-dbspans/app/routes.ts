import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('db', 'routes/db.tsx'),
  route('db2', 'routes/db2.tsx'),
  route('db3', 'routes/db3.tsx'),
  route('db4', 'routes/db4.tsx'),
  route('db5', 'routes/db5.tsx'),
  route('sentinel', 'routes/sentinel.tsx'),
] satisfies RouteConfig;
