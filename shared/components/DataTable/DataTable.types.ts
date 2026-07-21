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
