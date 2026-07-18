# 1. Multi-widget frontend architecture

Date: 2026-07-18

## Status

Accepted

## Context

Approbiom ships several custom Grist widgets. Grist embeds each one **by URL, in
its own iframe** — a widget is not a route inside a larger app, it is an
independent static site.

The widgets have interactive, stateful UIs and share components, so we need a
component model and a build toolchain. They also share a release cycle: they
ship together, from one commit, and their dependencies never diverge.

Deployment is GitHub Pages: static files only, no server, no runtime environment
variables. Staging and production must be live **at the same time**
(`/staging/widget-a/`, `/prod/widget-a/`) so a widget can be validated in a
staging Grist document while production keeps serving. What reaches production
must be what was validated — rebuilding for production would deploy bytes nobody
tested, since dependency resolution or toolchain drift can change the output
between two runs.

## Decision

**One entry point per widget.** Each widget owns an `index.html` and its own
`src/`. One `index.html` = one app = one bundle, matching Grist's
one-iframe-per-widget model: each is deployable at its own URL, and no widget can
break another through shared runtime state.

**Vite.** It is entry-point-oriented — an `index.html` *is* the unit of build —
ships a hot-reload dev server, and exposes a JS API so `scripts/build.mjs` can
drive it per widget. Its `base` option is what makes promotion-by-copy possible.

**One shared `package.json`**, no workspace, no per-widget package. Widgets are
folders, not packages. They ship together and share dependency versions, so
version boundaries between them would negotiate a conflict that cannot occur.
Shared code lives in `shared/`, resolved at build time through a `@shared`
alias — source code, not a published package.

**Public URLs are `/widget-a/`, not `/widgets/widget-a/`.** The deployed URL is a
public contract: it is pasted into Grist documents and outlives any source
reorganisation, so it should not leak how the repo happens to be arranged. The
path already carries the environment (`/staging/`, `/prod/`); a `widgets/`
segment would only add noise to a URL a human copies by hand. A dev-only Vite
plugin rewrites `/widget-a/*` to `/widgets/widget-a/*` so dev and production URLs
stay identical.

**One Vite build per widget, not a single multi-page build.** Multi-page output
mirrors the *input* folder structure, so it would produce
`dist/widgets/widget-a/` and require a post-build move — trading a loop for file
shuffling. It would also factor common code into chunks shared between entries,
which couples widgets that Grist loads in separate iframes and never benefits
from the sharing. Building each widget with `root` set to its own folder yields
the right tree directly and keeps each bundle self-contained.

**Deploy relative, promote by copy.** `base: './'` makes built HTML reference
`./assets/…` instead of `/assets/…`, so a build has no knowledge of the path it
is served from. The same bytes work at `/staging/widget-a/` and
`/prod/widget-a/`, and promotion is `cpSync(dist/staging, dist/prod)` — never a
rebuild. With absolute URLs a build is pinned to one path, and promotion would
require rebuilding.

## Consequences

Adding `widget-c` is creating a folder: `scripts/build.mjs` discovers widgets by
listing `widgets/`, so no configuration changes. Promotion is auditable
(`diff -r dist/staging dist/prod` is empty).

React and shared code are duplicated into every bundle,
with no chunk shared across widgets — the accepted cost of self-contained
bundles. Revisit if one Grist page routinely embeds many widgets.

`shared/` has no version boundary: a change there hits every widget at once, so a
shared change may be validated against only one widget in staging.

`base: './'` looks removable and is not. Deleting it breaks promotion **in
production only**, since staging would still work at its own path.

The dev-URL rewrite is custom code to maintain, accepted because divergent dev
and production links fail silently in production instead.

The root `index.html` launcher is copied, not built, so it must stay
import-free. Giving it a stylesheet means giving it a real Vite build.