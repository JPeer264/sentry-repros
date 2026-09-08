import { tracingChannel, channel } from 'node:diagnostics_channel';

const ch = tracingChannel('probe:x');
const info = {
  typeofHasSubscribers: typeof ch.start.hasSubscribers,
  valueHasSubscribers: String(ch.start.hasSubscribers).slice(0, 120),
  plainChannelTypeof: typeof channel('probe:plain').hasSubscribers,
};
let globalScopeRunStores = 'not-attempted';
try {
  ch.start.runStores({}, () => 1);
  globalScopeRunStores = 'ok';
} catch (e) {
  globalScopeRunStores = `throw: ${e.message.slice(0, 60)}`;
}
export default {
  fetch() {
    let inHandler = 'not-attempted';
    try {
      ch.start.runStores({}, () => 1);
      inHandler = 'ok';
    } catch (e) {
      inHandler = `throw: ${e.message.slice(0, 60)}`;
    }
    return new Response(JSON.stringify({ ...info, globalScopeRunStores, inHandler }));
  },
};
