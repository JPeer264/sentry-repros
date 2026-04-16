# Issue #12938 Reproduction

Standalone reproduction for [getsentry/sentry-javascript#12938](https://github.com/getsentry/sentry-javascript/issues/12938).

## Problem

The Sentry Feedback widget's screenshot feature uses `navigator.mediaDevices.getDisplayMedia()`, which fails in iframes that don't have the `display-capture` permission. This is common in embedded app environments like Shopify.

## Setup

### Using published packages

```bash
pnpm install
pnpm dev
```

## Testing

1. Open http://localhost:8766/src/host.html
2. Click the Sentry Feedback button (bottom-right corner of the iframe)
3. Click the screenshot/camera icon
4. **Before fix:** Error is thrown and screenshot fails silently
5. **After fix:** File upload fallback appears, allowing manual screenshot upload
