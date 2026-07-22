import type { ReactNode } from 'react'

export type Column<T> = {
    // Unique within a table. Used as the React key of the header and of every
    // cell in the column; it is deliberately not emitted in the DOM, so two
    // tables on the same page can reuse the same column ids.
    id: string
    header: ReactNode
    render: (row: T) => ReactNode
}

export type DataTableProps<T> = {
    // Required: `<caption>` is the accessible name of the table, and a data
    // table without one is hard to make sense of with a screen reader.
    caption: string
    // Read-only arrays: the table only iterates over them, and accepting
    // `readonly` lets callers pass frozen or `as const` data without a cast.
    rows: readonly T[]
    columns: readonly Column<T>[]
    // Draws DSFR's `fr-table--bordered`: a rule between every cell, columns
    // included, rather than the horizontal ones only. Off by default, like the
    // design system's own default — the vertical rules are worth their ink on a
    // wide table read column by column, and noise on a narrow one.
    bordered?: boolean
    // Keeps the header row in place while the rows scroll under it. DSFR ships
    // no class for this — only `fr-cell--fixed` for columns — so the rules live
    // in DataTable.css, built on the same `position: sticky` the design system
    // already uses there.
    //
    // It only has an effect where the table actually scrolls inside itself,
    // which means a caller that gives `fr-table__container` a bounded height.
    // Left to the caller rather than capped here: how much room the table gets
    // is a decision of the page, not of the table.
    stickyHeader?: boolean
    // Selection is controlled by the parent: the table renders what it is
    // given and reports back what the user asked for, it never holds a
    // selection of its own. Rows are matched by identity, so the objects handed
    // back are the very ones passed in `rows`.
    selectedRows?: readonly T[]
    // Providing this is what turns the selection column on.
    onSelectionChange?: (rows: T[]) => void
    // Accessible name of a row's checkbox — "Sélectionner le plan Plan Nord"
    // rather than a bare position. DSFR hides this text visually inside a fixed
    // cell but keeps it as the name, so it is worth writing properly. Without
    // it the table falls back to the row's position, which is understandable
    // but says nothing about which row is being selected.
    selectionLabel?: (row: T) => string
}
