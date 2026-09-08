import '../sentry.server.config.js';
import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = (_ctx, next) => next();
