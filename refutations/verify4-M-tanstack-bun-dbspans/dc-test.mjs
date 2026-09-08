import dc from 'node:diagnostics_channel';
const a = dc.tracingChannel('orchestrion:mysql:query');
const b = dc.tracingChannel('orchestrion:mysql:query');
console.log('same object:', a === b);
b.subscribe({ start(){ console.log('START fired'); }, end(){}, asyncStart(){}, asyncEnd(){}, error(){} });
console.log('a.start.hasSubscribers:', a.start.hasSubscribers);
console.log('b.start.hasSubscribers:', b.start.hasSubscribers);
const ctx = {};
a.start.runStores(ctx, () => console.log('inside runStores'));
