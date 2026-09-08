import '@sentry/deno/import';
import './instrument.ts';
import { runApp } from './app-active.ts';

await runApp();
