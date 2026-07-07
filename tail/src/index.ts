/**
 * Tail consumer worker for cloudflare/workerd#6861.
 *
 * Referencing this worker from the main worker's `tail_consumers` is what makes
 * workerd attach a tracer to the main worker's IoContext. That tracer is what
 * `Channel::publish` forwards diagnostics-channel events to (and where the
 * "Failed to publish diagnostics channel message" exception is recorded).
 *
 * This handler dumps everything it receives so both effects are visible:
 *  - `diagnosticsChannelEvents`: the app's publishes, forwarded without opt-in.
 *  - `exceptions`: the "Failed to publish diagnostics channel message" errors.
 */
interface TraceItem {
  scriptName?: string | null;
  outcome?: string;
  diagnosticsChannelEvents?: Array<{ channel: string; timestamp: number; message: unknown }>;
  exceptions?: Array<{ name: string; message: string; timestamp: number }>;
}

export default {
  tail(events: TraceItem[]) {
    for (const event of events) {
      const dce = event.diagnosticsChannelEvents ?? [];
      const exceptions = event.exceptions ?? [];

      console.log(
        `trace received: outcome=${event.outcome} ` +
          `diagnosticsChannelEvents=${dce.length} exceptions=${exceptions.length}`,
      );

      for (const e of dce) {
        console.log(`  ↳ diagnosticsChannelEvent channel="${e.channel}" message=${JSON.stringify(e.message)}`);
      }
      for (const ex of exceptions) {
        console.log(`  ↳ exception ${ex.name}: ${ex.message}`);
      }
    }
  },
};
