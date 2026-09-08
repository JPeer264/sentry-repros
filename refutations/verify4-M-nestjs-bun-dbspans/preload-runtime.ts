import { sentryBunPlugin } from '@sentry/bun/plugin';
// @ts-ignore
Bun.plugin(sentryBunPlugin());
import './src/instrument';
