# 2. Grist Desktop as local integration environment

Date: 2026-07-18

## Status

Accepted

## Context

Custom widgets run inside Grist and depend on the Grist plugin API. Opening a
widget directly in a browser is not a faithful test: the standalone page has no
host document, no plugin API, and none of the iframe context Grist provides.
It also misrepresents UI and UX, since the widget renders at the full window
size rather than in the panel Grist actually gives it.

The alternative to a real host is a mock of the plugin API — code that has to be
written, kept in sync with Grist's, and trusted to be wrong in no important way.

## Decision

We will use **Grist Desktop as the primary local integration environment**.

Widgets are served by the Vite dev server and loaded into Grist Desktop as
custom widgets by their local URL (`http://localhost:5173/widget-a/`). Hot
reload continues to work through the iframe, so the normal development loop is
unchanged — the widget is simply hosted by real Grist instead of a bare tab.

## Consequences

Development happens against the real Grist runtime, so the plugin API is
validated continuously rather than at integration time, and the widget is seen
at its true size in a real document. No custom Grist mock has to be written or
maintained. Everything runs locally, so no internet connection and no shared
staging document are needed to work.

In exchange, contributors must install Grist Desktop before they can do
meaningful widget work — the repo alone is no longer a sufficient setup.

Behaviour specific to a hosted Grist server — access rules, authentication,
cross-origin constraints, and version differences between Desktop and the
deployed instance — is not covered by this environment and is still only
exercised later, in the staging Grist document.

The environment also differs from a standard browser environment, so browser-specific behavior should still be verified separately.
For instance, it misses Grist native custom widgets.
