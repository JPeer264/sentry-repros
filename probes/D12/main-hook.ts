import '@sentry/deno/import';
import './instrument.ts';
import { runApp } from './app.ts';

await runApp();
