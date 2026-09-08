import { sentryBunPlugin } from '@sentry/bun/plugin';
const keepExternal = (names: string[]) => ({ name: 'keep-external', setup(b: any) { b.config.external = [...(b.config.external ?? []), ...names]; } });
const ext = ['@sentry/remix','@sentry/node','@sentry/core','@sentry/bun','@sentry/server-utils','@sentry/opentelemetry','@sentry/server-runtime-injection'];
console.log('A bundled-express:', (await Bun.build({ entrypoints: ['./mini.mjs'], outdir: './dist-mini-a', target: 'bun', external: ext, plugins: [sentryBunPlugin()] })).success);
console.log('B external-express:', (await Bun.build({ entrypoints: ['./mini.mjs'], outdir: './dist-mini-b', target: 'bun', external: ext, plugins: [sentryBunPlugin(), keepExternal(['express'])] })).success);
