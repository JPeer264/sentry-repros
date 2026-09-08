import './instrument6';
import * as Sentry from '@sentry/bun';
import { boom } from './src/boom';

const ECHO_PORT = process.env.ECHO_PORT;

Bun.serve({
  port: Number(process.env.PORT),
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname !== '/probe') return new Response('ok');

    console.log('crumb');
    await fetch(`http://127.0.0.1:${ECHO_PORT}/echo-endpoint`);

    const flagIntegration = Sentry.getClient()?.getIntegrationByName('FeatureFlags') as
      | { addFeatureFlag?: (name: string, value: unknown) => void }
      | undefined;
    flagIntegration?.addFeatureFlag?.('my-flag', true);

    console.error('captured?');

    let err: unknown;
    try { boom(); } catch (e) { err = e; }
    const id1 = Sentry.captureException(err);
    const id2 = Sentry.captureException(err);

    Sentry.captureMessage('sentinel');
    await Sentry.flush(4000);

    return Response.json({
      flagIntegration: !!flagIntegration,
      addFeatureFlagOnIntegration: typeof flagIntegration?.addFeatureFlag,
      sentryAddFeatureFlag: typeof (Sentry as Record<string, unknown>).addFeatureFlag,
      id1,
      id2,
      integrations: Object.keys((Sentry.getClient() as unknown as { _integrations: Record<string, unknown> })._integrations ?? {}),
    });
  },
});
