import dc from 'node:diagnostics_channel';
console.log('has tracingChannel:', typeof dc.tracingChannel);
const tc = dc.tracingChannel('mysql2:query');
console.log('tc keys:', Object.keys(tc));
console.log('start.hasSubscribers before:', tc.start.hasSubscribers);
tc.subscribe({ start(){}, end(){}, asyncStart(){}, asyncEnd(){}, error(){} });
console.log('start.hasSubscribers after:', tc.start.hasSubscribers);
const tc2 = dc.tracingChannel('mysql2:query');
console.log('same object:', tc2 === tc, 'tc2 start.hasSubscribers:', tc2.start.hasSubscribers);
