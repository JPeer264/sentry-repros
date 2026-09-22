# Reproduction for Bun `diagnostics_channel` subscriptions lost after GC

In Bun, a `diagnostics_channel` subscription is dropped once the channel object is garbage collected. Node keeps a channel alive while it has subscribers, so `hasSubscribers` stays `true`.

The script subscribes in 3 ways, forces a GC in a later task, and then checks `hasSubscribers`:

- `diagnostics_channel.channel(name).subscribe(fn)`
- `diagnostics_channel.subscribe(name, fn)`
- `diagnostics_channel.tracingChannel(name).subscribe(handlers)`

## Reproduction Steps

1. Run the script with Node:
   ```sh
   $ node repro.cjs
   {"channel(name).subscribe":true,"diagnostics_channel.subscribe(name)":true,"tracingChannel(name).subscribe":true}
   ```

2. Run the script with Bun:
   ```sh
   $ bun repro.cjs
   {"channel(name).subscribe":false,"diagnostics_channel.subscribe(name)":false,"tracingChannel(name).subscribe":false}
   ```

Tested with Node v22.23.1 and Bun 1.4.2.
