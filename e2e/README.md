# E2E Tests

End-to-end tests for the Grist widgets, using [Playwright](https://playwright.dev).  
Tests run against the production build served locally by `vite preview`.

## Prerequisites

A build must exist before running tests:

```bash
pnpm run build-only
```

## Running tests

```bash
# Headless (CI-style)
pnpm run test:e2e
```

## Adding tests for a new widget

1. Create `e2e/<widget-name>/<widget-name>.spec.ts`.
2. Copy the `beforeEach` block from an existing spec (mock + `page.goto`).
3. Update `WIDGET_URL` to point to the new widget's path.
4. Add widget-specific `grist.onRecord` / `grist.onRecords` stubs to the mock
   if the new widget uses API methods not already present in
   `e2e/mocks/grist-plugin-api.js`.
