import { DSN, TUNNEL } from './config';

export default () => ({
  dsn: DSN,
  tracesSampleRate: 1.0,
  debug: true,
  tunnel: TUNNEL,
});
