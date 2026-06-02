# 2. Grist dev instance served via a Vite plugin

Date: 2026-06-02

## Status

Accepted

## Context

Developing a Grist widget requires two things running simultaneously:

1. The widget dev server (Vite, port 5173) — with HMR so changes are reflected
   instantly inside the Grist iframe.
2. A local Grist instance that can load the widget — the `dev/` folder provides
   this: `dev/index.html` bootstraps `grist-static` and opens `test-dev.grist`.

Without a local Grist instance, the developer must either configure a remote
Grist document to point to `localhost:5173` (cumbersome) or work blind without
a host frame at all.

The question was how to serve `dev/` alongside the widget dev server without
adding complexity to the workflow or polluting the production build in `docs/`.

## Decision

Add a **Vite plugin** (`dev-grist-server`) directly in `vite.config.ts` that
spawns a minimal Node.js static HTTP server (port **5175**) serving the `dev/`
directory.

Key properties of the approach:

- `apply: "serve"` — the plugin is entirely skipped during `vite build`, so
  `dev/` files can never end up in `docs/`.
- No new dependency — the server is built from Node's built-in `node:http` and
  `node:fs` modules, which are already available in the config file context.
- Single command — `pnpm dev` starts both servers; no parallel script
  orchestration (e.g. `npm-run-all2`) needed.
- The Grist URL is printed by wrapping `server.printUrls` so it appears inline
  with Vite's own URL block, not before or after it.
- Path traversal is prevented by asserting the resolved file path starts with
  `devDir + sep` before any file read.

## Consequences

- `pnpm dev` is the single entry point for all local development; no extra steps.
- `pnpm build` is unaffected — `dev/` is excluded by `apply: "serve"`.
- The static server has no HMR; changes to `dev/index.html` or `test-dev.grist`
  require a browser refresh on port 5175.
- The MIME map in the plugin must be extended if new file types are added to
  `dev/` (currently covers html, js, css, grist, json, svg, images, fonts).
