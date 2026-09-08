import dc from 'node:diagnostics_channel';
import { AsyncLocalStorage } from 'node:async_hooks';
const als = new AsyncLocalStorage();
const sdk = dc.tracingChannel('orchestrion:mysql:query');
sdk.start.bindStore(als, (d) => ({ bound: true }));
sdk.subscribe({ start(){console.log('SDK start')}, end(){}, asyncStart(){}, asyncEnd(){}, error(){} });

const injected = dc.tracingChannel('orchestrion:mysql:query');
const has = (ch) => ch.start.hasSubscribers || ch.end.hasSubscribers || ch.asyncStart.hasSubscribers || ch.asyncEnd.hasSubscribers || ch.error.hasSubscribers;
console.log('injected hasSubscribers:', has(injected));
console.log('  start:', injected.start.hasSubscribers, 'end:', injected.end.hasSubscribers, 'asyncStart:', injected.asyncStart.hasSubscribers, 'asyncEnd:', injected.asyncEnd.hasSubscribers, 'error:', injected.error.hasSubscribers);
