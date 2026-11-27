import '@gouvfr/dsfr/dist/component/table/table.main.min.css'
import '@gouvfr/dsfr/dist/component/checkbox/checkbox.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-arrows/icons-arrows.main.min.css'
import './DataTable.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import { Fragment, useId, useMemo, useState } from 'react'
import type { DataTableProps, SortDirection } from './DataTable.types'

/** Numbers compare as numbers, anything else with French collation. */
function compare(a: string | number, b: string | number): number {
    if (typeof a === 'number' && typeof b === 'number') return a - b

    return String(a).localeCompare(String(b), 'fr', { numeric: true })
}

export default function DataTable<T>({
    caption,
    hideCaption = false,
    description,
    showResultCount = false,
    headerActions,
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
    const id = useId()
    const titleId = `${id}-title`
    const countId = `${id}-count`
    const descriptionId = `${id}-description`

    // Keyed by the row object: filtering and sorting move a row's index.
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

    // Never goes back to unsorted; a newly sorted column starts ascending.
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

        // Rebuilt from `sortedRows` so the selection comes back in displayed
        // order, with the caller's own row objects.
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

    // Never inside the title hidden by `hideCaption`: an invisible field would still be tabbable.
    const actions = headerActions !== undefined && (
        <div className="shared-data-table__header-actions">{headerActions}</div>
    )

    return (
        <div className={rootClassName}>
            {hideCaption && actions}
            {/* Outside `fr-table__wrapper`, the scrolling box, so the title does not scroll
                away with the rows; named through `aria-labelledby` instead of a `<caption>`. */}
            <div
                className={`shared-data-table__header${hideCaption ? ' fr-sr-only' : ''}`}
            >
                <div className="shared-data-table__header-title">
                    <span id={titleId}>{caption}</span>
                    {!hideCaption && actions}
                    {showResultCount && (
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
                                                    // `indeterminate` has no HTML attribute.
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
                                            <th
                                                key={column.id}
                                                scope="col"
                                                aria-sort={
                                                    column.sortBy
                                                        ? (direction ?? 'none')
                                                        : undefined
                                                }
                                            >
                                                {column.sortBy ? (
                                                    // Not on the `th`: DSFR's class is
                                                    // `display: flex`, which breaks table layout.
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
                                {/* Index key: rows carry no stable id, so after a sort, state held inside a row (component state, uncontrolled inputs, focus) stays with the position, not the row. */}
                                {sortedRows.map((row, rowIndex) => {
                                    const isSelected =
                                        isSelectable && selected.has(row)
                                    const isExpanded = expandedRows.has(row)
                                    const detailId = `${id}-detail-${rowIndex}`

                                    return (
                                        <Fragment key={rowIndex}>
                                            <tr
                                                // DSFR draws the selected-row outline from this attribute.
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
                                                // Always rendered so `aria-controls` resolves.
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
