import '@gouvfr/dsfr/dist/component/table/table.main.min.css'
import '@gouvfr/dsfr/dist/component/checkbox/checkbox.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-arrows/icons-arrows.main.min.css'
import './DataTable.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import { Fragment, useId, useMemo, useState } from 'react'
import type { DataTableProps, SortDirection } from './DataTable.types'

/** Numbers compare as numbers; anything else as French text, so that accents
 *  land where a reader expects and "10" comes after "9" rather than before. */
function compare(a: string | number, b: string | number): number {
    if (typeof a === 'number' && typeof b === 'number') return a - b

    return String(a).localeCompare(String(b), 'fr', { numeric: true })
}

export default function DataTable<T>({
    caption,
    description,
    showResultCount = false,
    expandable,
    rows,
    columns,
    bordered = false,
    stickyHeader = false,
    multiLine = false,
    selectedRows,
    onSelectionChange,
    selectionLabel,
}: DataTableProps<T>) {
    // Ids only have to be unique in the document; `useId` keeps two tables on
    // the same page from pointing their labels at each other's checkboxes.
    const id = useId()
    const titleId = `${id}-title`
    const countId = `${id}-count`
    const descriptionId = `${id}-description`

    // Keyed by the row object, not its index: filtering and sorting move a row's
    // position, and an index would leave whichever row landed there open.
    const [expandedRows, setExpandedRows] = useState<ReadonlySet<T>>(new Set())

    function toggleExpanded(row: T) {
        setExpandedRows((current) => {
            const next = new Set(current)
            if (!next.delete(row)) next.add(row)
            return next
        })
    }

    const [sort, setSort] = useState<{
        columnId: string
        direction: SortDirection
    } | null>(null)

    // Ascending on the first click, then flips between the two directions. The
    // table starts unsorted and stops being so for good: a column taken over by
    // another one starts from ascending again.
    function toggleSort(columnId: string) {
        setSort((current) =>
            current?.columnId === columnId && current.direction === 'ascending'
                ? { columnId, direction: 'descending' }
                : { columnId, direction: 'ascending' }
        )
    }

    const sortedRows = useMemo(() => {
        const sortBy = columns.find(
            (column) => column.id === sort?.columnId
        )?.sortBy
        if (!sort || !sortBy) return rows

        const direction = sort.direction === 'ascending' ? 1 : -1

        // `toSorted`, never `sort`: `rows` belongs to the caller.
        return rows.toSorted(
            (a, b) => direction * compare(sortBy(a), sortBy(b))
        )
    }, [rows, columns, sort])

    const selected = new Set(selectedRows)
    const isSelectable = onSelectionChange !== undefined
    const columnCount = columns.length + (isSelectable ? 1 : 0)
    const allSelected =
        rows.length > 0 && rows.every((row) => selected.has(row))
    const someSelected = rows.some((row) => selected.has(row))

    function toggleRow(row: T, checked: boolean) {
        const next = new Set(selected)
        if (checked) next.add(row)
        else next.delete(row)

        // Rebuilt from `rows` rather than appended to: the caller always gets
        // the selection in the table's own order, whatever order it was
        // clicked in. `selectedRows` itself is never touched, and the row
        // objects are passed through by reference.
        onSelectionChange?.(
            sortedRows.filter((candidate) => next.has(candidate))
        )
    }

    const rootClassName = [
        'fr-table',
        'fr-table--sm',
        multiLine && 'fr-table--multiline',
        bordered && 'fr-table--bordered',
        stickyHeader && 'shared-data-table--sticky-header',
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <div className={rootClassName}>
            {/* Deliberately outside `fr-table__wrapper`. Its container is the
                scrolling box, and a `<caption>` — which the HTML parser will
                only accept inside `<table>` — therefore scrolls away with the
                rows and puts the scrollbar alongside the title. Named through
                `aria-labelledby` instead, so the heading is still the table's
                accessible name without the text existing twice. */}
            <div className="shared-data-table__header">
                <div className="shared-data-table__header-title">
                    <span id={titleId}>{caption}</span>
                    {showResultCount && (
                        // Announced on change, not on load: a sighted reader
                        // watches the count move as filters are applied, and
                        // this is the only way anyone else hears it.
                        <span
                            id={countId}
                            className="shared-data-table__result-count"
                            aria-live="polite"
                        >
                            {rows.length} résultat
                            {rows.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                {description && (
                    <p
                        id={descriptionId}
                        className="shared-data-table__description"
                    >
                        {description}
                    </p>
                )}
            </div>
            <div className="fr-table__wrapper">
                <div className="fr-table__container">
                    <div className="fr-table__content">
                        <table
                            aria-labelledby={
                                showResultCount
                                    ? `${titleId} ${countId}`
                                    : titleId
                            }
                            aria-describedby={
                                description ? descriptionId : undefined
                            }
                        >
                            <thead>
                                <tr>
                                    {isSelectable && (
                                        <th
                                            scope="col"
                                            className="fr-cell--fixed"
                                        >
                                            <div className="fr-checkbox-group fr-checkbox-group--sm">
                                                <input
                                                    type="checkbox"
                                                    id={`${id}-all`}
                                                    checked={allSelected}
                                                    disabled={rows.length === 0}
                                                    // `indeterminate` is a DOM
                                                    // property with no HTML
                                                    // attribute, so it can only
                                                    // be set on the node itself.
                                                    ref={(input) => {
                                                        if (input)
                                                            input.indeterminate =
                                                                someSelected &&
                                                                !allSelected
                                                    }}
                                                    onChange={(event) =>
                                                        onSelectionChange(
                                                            event.target.checked
                                                                ? [...rows]
                                                                : []
                                                        )
                                                    }
                                                />
                                                <label
                                                    className="fr-label"
                                                    htmlFor={`${id}-all`}
                                                >
                                                    Tout sélectionner
                                                </label>
                                            </div>
                                        </th>
                                    )}
                                    {columns.map((column) => {
                                        const direction =
                                            sort?.columnId === column.id
                                                ? sort.direction
                                                : undefined

                                        return (
                                            // `scope="col"` ties every cell
                                            // below to this header when a screen
                                            // reader announces a row.
                                            <th
                                                key={column.id}
                                                scope="col"
                                                // On the `th`, where the
                                                // columnheader role reads it —
                                                // the button below carries the
                                                // matching state as a class,
                                                // which is what DSFR styles.
                                                aria-sort={
                                                    column.sortBy
                                                        ? (direction ?? 'none')
                                                        : undefined
                                                }
                                            >
                                                {column.sortBy ? (
                                                    // Wrapper rather than the
                                                    // `th` itself: DSFR's class
                                                    // is `display: flex`, which
                                                    // on a cell would drop it
                                                    // out of the table's own
                                                    // layout and unalign the
                                                    // column.
                                                    <div className="fr-cell--sort">
                                                        <span>
                                                            {column.header}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className={`fr-btn fr-btn--sort`}
                                                            onClick={() =>
                                                                toggleSort(
                                                                    column.id
                                                                )
                                                            }
                                                        >
                                                            Trier
                                                        </button>
                                                    </div>
                                                ) : (
                                                    column.header
                                                )}
                                            </th>
                                        )
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {/* The row index is a safe React key as long as
                                    the table only ever displays `rows` in the
                                    given order. Sorting, filtering or row
                                    selection would each break that assumption
                                    and are the point at which callers should
                                    start supplying a stable key themselves. */}
                                {sortedRows.map((row, rowIndex) => {
                                    const isSelected =
                                        isSelectable && selected.has(row)
                                    const isExpanded = expandedRows.has(row)
                                    const detailId = `${id}-detail-${rowIndex}`

                                    return (
                                        <Fragment key={rowIndex}>
                                            <tr
                                                // DSFR draws the blue outline of a
                                                // selected row from this attribute;
                                                // its own table script sets the
                                                // same one.
                                                aria-selected={
                                                    isSelectable
                                                        ? isSelected
                                                        : undefined
                                                }
                                                className={
                                                    isSelected
                                                        ? 'shared-data-table__row--selected'
                                                        : undefined
                                                }
                                            >
                                                {isSelectable && (
                                                    <td className="fr-cell--fixed">
                                                        <div className="fr-checkbox-group fr-checkbox-group--sm">
                                                            <input
                                                                type="checkbox"
                                                                id={`${id}-${rowIndex}`}
                                                                checked={
                                                                    isSelected
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    toggleRow(
                                                                        row,
                                                                        event
                                                                            .target
                                                                            .checked
                                                                    )
                                                                }
                                                            />
                                                            <label
                                                                className="fr-label"
                                                                htmlFor={`${id}-${rowIndex}`}
                                                            >
                                                                {selectionLabel
                                                                    ? selectionLabel(
                                                                          row
                                                                      )
                                                                    : `Sélectionner la ligne ${rowIndex + 1}`}
                                                            </label>
                                                        </div>
                                                    </td>
                                                )}
                                                {columns.map((column) => (
                                                    <td key={column.id}>
                                                        {expandable?.columnId ===
                                                        column.id ? (
                                                            <button
                                                                type="button"
                                                                className="shared-data-table__disclosure"
                                                                aria-expanded={
                                                                    isExpanded
                                                                }
                                                                aria-controls={
                                                                    detailId
                                                                }
                                                                onClick={() =>
                                                                    toggleExpanded(
                                                                        row
                                                                    )
                                                                }
                                                            >
                                                                <span
                                                                    className="fr-icon-arrow-right-s-line shared-data-table__disclosure-icon"
                                                                    aria-hidden="true"
                                                                />
                                                                {column.render(
                                                                    row
                                                                )}
                                                            </button>
                                                        ) : (
                                                            column.render(row)
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                            {expandable && (
                                                // Rendered whether open or not, so
                                                // `aria-controls` always resolves to
                                                // something; `hidden` is what closes
                                                // it.
                                                <tr
                                                    id={detailId}
                                                    hidden={!isExpanded}
                                                    className="shared-data-table__detail"
                                                >
                                                    <td colSpan={columnCount}>
                                                        {expandable.render(row)}
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
