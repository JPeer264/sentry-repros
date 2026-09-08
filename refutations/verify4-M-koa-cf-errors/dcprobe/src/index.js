import * as dc from 'node:diagnostics_channel';

const ch = dc.tracingChannel('probe:test2');
const results = {
  channelHasSubscribersType: typeof ch.start.hasSubscribers,
  channelHasSubscribersValue: String(ch.start.hasSubscribers),
  guardResult: !!(ch.start.hasSubscribers || ch.end.hasSubscribers),
  tracingChannelHasSubscribersType: typeof ch.hasSubscribers,
  bareChannelHasSubscribers: (() => { const c = dc.channel('probe:bare'); return { type: typeof c.hasSubscribers, val: String(c.hasSubscribers) }; })(),
};
export default { fetch() { return new Response(JSON.stringify(results, null, 2)); } };
