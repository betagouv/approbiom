# 1. E2E testing with Playwright

Date: 2026-06-02

## Status

Accepted

## Context

The project builds several independent Grist widgets (Vue 3 + Vite). Each widget
runs inside a Grist-managed iframe and communicates with the host document through
the Grist Plugin API (`window.grist`), injected at runtime from
`https://docs.getgrist.com/grist-plugin-api.js`.

The project had no automated tests. The first priority was to establish a minimal
but realistic testing baseline that:

- exercises the real built output (not a mocked component tree),
- works without a live Grist instance or a fake host iframe,
- is simple enough to copy for each new widget,
- can run in CI without additional infrastructure.

## Decision

Use **Playwright** for E2E tests, running against the **production build** served
by `vite preview`.

**Grist API mock strategy**: Playwright intercepts the HTTP request to
`https://docs.getgrist.com/grist-plugin-api.js` using `page.route()` and
responds with a minimal local file that defines `window.grist`:

```js
window.grist = {
  ready: () => {},
  onRecord: (cb) => {
    window.__gristOnRecord = cb;
  },
};
```

Tests then drive the widget by calling `window.__gristOnRecord(row, mappings)`
via `page.evaluate()`, which is identical to what the Grist host does in
production. No fake iframe, no separate mock server, no test-only code in the
widget itself.

**Test server**: `vite preview --port 4173` serves the `docs/` build output.
Tests require a prior `pnpm run build-only`. For CI, the pipeline runs build then
tests sequentially.

## Consequences

- Tests run against the real built artefact, catching bundling or asset issues
  that unit tests would miss.
- The mock is a thin shim — it does not emulate the full Grist API. Tests that
  need additional API methods (e.g. `grist.onRecords`, `grist.getTable`) must
  extend `e2e/mocks/grist-plugin-api.js` as those widgets are added.
- `vite preview` does not hot-reload; a rebuild is required before re-running
  tests after source changes.
- The HTML reporter output (`playwright-report/`) and raw results
  (`test-results/`) are gitignored.
