# 4. Read attachment metadata through the Grist API, one plan at a time

Date: 2026-10-12

## Status

Accepted

## Context

The widgets show the name and size of each attachment. They read them from Grist's metadata table `_grist_Attachments`.

The Approbiom document has access rules. In such a document, Grist hides `_grist_Attachments` from users who are not owners: an editor gets an empty table. The attachments were then dropped, and an editor saw « Aucune pièce jointe n'est liée à ce plan » for every plan.

The Grist API still describes a file the user is allowed to read: `GET /attachments/{id}` returns its name and size to an editor.

## Decision

- When a file is missing from `_grist_Attachments`, its metadata is read from `GET /attachments/{id}`, with the widget's access token. Owners keep reading the table, without extra requests.
- The attachment port gets `listByPlan(plan)`. A widget that shows the documents of one plan loads them when the plan is chosen, instead of listing every attachment of the document at start.

## Consequences

- Editors see the documents of a plan, and can download and extract them.
- An editor makes one request per file of the chosen plan, usually a few. A widget that still calls `list()` makes one request per file of the whole document for an editor (about 270 on a copy of production): it should move to `listByPlan`.
- If Grist stops hiding `_grist_Attachments` from editors, the fallback is no longer used, and nothing has to change.
