import { tracingChannel, channel } from 'node:diagnostics_channel';

const ch = tracingChannel('probe:test');
const plain = channel('probe:plain');
const info = {
  typeofStartHasSubscribers: typeof ch.start.hasSubscribers,
  startHasSubscribersValue: String(ch.start.hasSubscribers),
  typeofPlainHasSubscribers: typeof plain.hasSubscribers,
  plainValue: String(plain.hasSubscribers),
};
export default {
  fetch() {
    let inHandler = 'ok';
    try {
      ch.start.runStores({ a: 1 }, () => 'ok');
    } catch (e) {
      inHandler = String(e);
    }
    return Response.json({ ...info, inHandler });
  },
};
