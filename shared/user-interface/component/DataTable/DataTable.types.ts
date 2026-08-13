import type { ReactNode } from 'react'

export type Column<T> = {
    id: string
    header: ReactNode
    render: (row: T) => ReactNode
    // Providing this is what puts a sort button in the column's header. It
    // returns what rows are ordered by, which is not what `render` returns: a
    // cell may hold a formatted string or an element, and neither sorts.
    sortBy?: (row: T) => string | number
}

export type SortDirection = 'ascending' | 'descending'

export type ExpandableRows<T> = {
    // Cells of this column become the toggle: they are what the reader clicks,
    // so it should be the column that names the row.
    columnId: string
    // Rendered in a full-width row under the one that was opened. Reached from
    // the toggle through `aria-controls`, so it stays in the DOM while closed.
    render: (row: T) => ReactNode
}

export type DataTableProps<T> = {
    caption: string
    rows: readonly T[]
    columns: readonly Column<T>[]

    bordered?: boolean
    stickyHeader?: boolean
    multiLine?: boolean

    selectedRows?: readonly T[]
    onSelectionChange?: (rows: T[]) => void
    selectionLabel?: (row: T) => string

    // Secondary line under the caption, in DSFR's own caption description slot.
    // It is read out as part of the table's accessible name, like the caption
    // itself, so one sentence is the right length.
    description?: string
    // Counts what is on screen — `rows.length`, after whatever the caller
    // filtered out — not the size of the data it came from. Off by default so
    // it never appears on a table that was not asked to show it.
    showResultCount?: boolean
    // Opens a detail row under the one that was clicked. Which rows are open is
    // the table's own business — nothing outside it acts on that — so unlike
    // the selection it is not reported back.
    expandable?: ExpandableRows<T>
}
