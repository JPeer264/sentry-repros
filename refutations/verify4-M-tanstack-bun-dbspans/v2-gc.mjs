import * as dcns from 'node:diagnostics_channel';

const NAME = 'orchestrion:probe:query';
// subscribe exactly the way the SDK does: no reference kept to the channel object
dcns.tracingChannel(NAME).subscribe({ start(){}, end(){}, asyncStart(){}, asyncEnd(){}, error(){} });
const has = () => dcns.tracingChannel(NAME).start.hasSubscribers;
console.log('immediately after subscribe:', has());
globalThis.Bun?.gc?.(true);
console.log('after Bun.gc(true):', has());

const NAME2 = 'orchestrion:probe:kept';
const kept = dcns.tracingChannel(NAME2);
kept.subscribe({ start(){}, end(){}, asyncStart(){}, asyncEnd(){}, error(){} });
globalThis.Bun?.gc?.(true);
console.log('kept-reference channel after Bun.gc(true):', dcns.tracingChannel(NAME2).start.hasSubscribers);
