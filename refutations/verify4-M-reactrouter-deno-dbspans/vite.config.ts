import { reactRouter } from '@react-router/dev/vite';
import { sentryReactRouter } from '@sentry/react-router/vite';
import { defineConfig } from 'vite';

const bundleCore = process.env.BUNDLE_CORE === '1';

const noExternal = [
  '@sentry/core',
  '@sentry/conventions',
  '@opentelemetry/api',
  'aws-ssl-profiles',
  'generate-function',
  'iconv-lite',
  'long',
  'lru.min',
  'named-placeholders',
  'sql-escaper',
  'denque',
  'seq-queue',
];

export default defineConfig(config => ({
  ...(bundleCore ? { ssr: { noExternal } } : {}),
  plugins: [reactRouter(), ...(process.env.SENTRY_VITE === '1' ? [sentryReactRouter({}, config)] : [])],
}));
