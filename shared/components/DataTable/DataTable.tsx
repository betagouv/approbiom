// The DSFR table script is deliberately not loaded — it only drives sorting and
// row selection, which this component does not do. Horizontal scrolling is pure
// CSS (`.fr-table__container { overflow: auto }`).
import '@gouvfr/dsfr/dist/component/table/table.main.min.css'
import '@gouvfr/dsfr/dist/component/checkbox/checkbox.main.min.css'
import './DataTable.css'
import { useId } from 'react'
import type { DataTableProps } from './DataTable.types'

export default function DataTable<T>({
    caption,
    rows,
    columns,
    selectedRows,
    onSelectionChange,
    selectionLabel,
}: DataTableProps<T>) {
    // Ids only have to be unique in the document; `useId` keeps two tables on
    // the same page from pointing their labels at each other's checkboxes.
    const id = useId()

    // Selection is controlled: this is a read of the prop, never state.
    const selected = new Set(selectedRows)
    const isSelectable = onSelectionChange !== undefined
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
        onSelectionChange?.(rows.filter((candidate) => next.has(candidate)))
    }

    return (
        <div className="fr-table">
            <div className="fr-table__wrapper">
                <div className="fr-table__container">
                    <div className="fr-table__content">
                        <table>
                            <caption>{caption}</caption>
                            <thead>
                                <tr>
                                    {isSelectable && (
                                        // `fr-cell--fixed` is DSFR's own sticky
                                        // cell: it carries position/left/z-index
                                        // and hides the label text of a checkbox
                                        // it contains while keeping it as the
                                        // accessible name.
                                        <th
                                            scope="col"
                                            className="fr-cell--fixed"
                                        >
                                            <div className="fr-checkbox-group fr-checkbox-group--sm">
                                                <input
                                                    type="checkbox"
                                                    id={`${id}-all`}
                                                    checked={allSelected}
                                                    // Nothing to select, so the
                                                    // control has nothing to say.
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
                                    {columns.map((column) => (
                                        // `scope="col"` ties every cell below
                                        // to this header when a screen reader
                                        // announces a row.
                                        <th key={column.id} scope="col">
                                            {column.header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {/* The row index is a safe React key as long as
                                    the table only ever displays `rows` in the
                                    given order. Sorting, filtering or row
                                    selection would each break that assumption
                                    and are the point at which callers should
                                    start supplying a stable key themselves. */}
                                {rows.map((row, rowIndex) => {
                                    const isSelected =
                                        isSelectable && selected.has(row)

                                    return (
                                        <tr
                                            key={rowIndex}
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
                                                            checked={isSelected}
                                                            onChange={(event) =>
                                                                toggleRow(
                                                                    row,
                                                                    event.target
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
                                                    {column.render(row)}
                                                </td>
                                            ))}
                                        </tr>
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
