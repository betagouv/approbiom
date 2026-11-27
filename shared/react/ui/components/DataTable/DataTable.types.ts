import type { ReactNode } from 'react'

export type Column<T> = {
    id: string
    header: ReactNode
    render: (row: T) => ReactNode
    // Makes the column sortable, on this value rather than what `render` shows.
    sortBy?: (row: T) => string | number
}

export type SortDirection = 'ascending' | 'descending'

export type ExpandableRows<T> = {
    // Cells of this column become the toggle.
    columnId: string
    render: (row: T) => ReactNode
}

export type DataTableProps<T> = {
    caption: string
    hideCaption?: boolean
    rows: readonly T[]
    columns: readonly Column<T>[]

    bordered?: boolean
    stickyHeader?: boolean
    multiLine?: boolean

    selectedRows?: readonly T[]
    onSelectionChange?: (rows: T[]) => void
    selectionLabel?: (row: T) => string

    // Part of the table's accessible name: keep it to one sentence.
    description?: string
    // Counts `rows.length`, i.e. after the caller's filtering.
    showResultCount?: boolean
    // Drawn on the title line; stays visible, on its own line, under `hideCaption`.
    headerActions?: ReactNode
    expandable?: ExpandableRows<T>
}
