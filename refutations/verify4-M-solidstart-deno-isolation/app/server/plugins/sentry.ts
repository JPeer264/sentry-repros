import * as Sentry from '@sentry/solidstart';
import { definePlugin } from 'nitro';

export default definePlugin(async () => {
  Sentry.init({
    dsn: 'https://public@localhost/1',
    tunnel: 'http://127.0.0.1:47311/',
    tracesSampleRate: 1.0,
    traceLifecycle: (process.env.SENTRY_LIFECYCLE as 'static' | 'stream') || 'static',
    debug: !!process.env.SENTRY_DEBUG,
  });

  if (process.env.WARM_ROUTES) {
    const { readdirSync, statSync } = await import('node:fs');
    const { fileURLToPath, pathToFileURL } = await import('node:url');
    const { dirname, join } = await import('node:path');
    const here = dirname(fileURLToPath(import.meta.url));
    const walk = (dir: string): string[] => {
      const out: string[] = [];
      for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) out.push(...walk(p));
        else if (f.endsWith('.mjs')) out.push(p);
      }
      return out;
    };
    let n = 0;
    for (const p of walk(here)) {
      try {
        await import(/* @vite-ignore */ pathToFileURL(p).href);
        n++;
      } catch (e) {
        console.log('[warm] failed', p, (e as Error).message);
      }
    }
    console.log('[warm] done', n);
  }
});
