# Reproduction for #18339 - Span buffering memory issue

This reproduction tests memory growth caused by span buffering when parent spans outlive their children.

## Setup

```bash
$ pnpm install
```

## Running

```bash
# Start the server with inspector
$ pnpm dev

# In another terminal, run load test
$ pnpm load-test
```

## Memory profiling

Connect Chrome DevTools to `chrome://inspect` and take heap snapshots during load testing to observe span buffer growth.

