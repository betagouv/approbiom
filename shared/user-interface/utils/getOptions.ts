import type { MultiSelectOption } from '@shared/user-interface/component/MultiSelect'

/**
 * Builds the options of a MultiSelect from the rows it filters: reads one value
 * per row, drops the duplicates and keeps the first-seen order.
 *
 * @param rows     Rows the filter applies to, duplicates included.
 * @param getValue Reads the filtered value off a row.
 * @param getLabel Writes the value the way it should be read on screen. Left
 *                 out, the value is shown as the document stores it.
 *
 * @remark Rows whose value is empty are dropped — they would render a nameless
 * checkbox. A filter that has to offer them needs an option of its own, with a
 * label saying what an empty value means (see `getAppelAProjetOptions`).
 */
export function getOptions<T>(
    rows: readonly T[],
    getValue: (row: T) => string,
    getLabel: (value: string) => string = (value) => value
): MultiSelectOption<string>[] {
    const values = new Set(rows.map(getValue))
    values.delete('')

    return Array.from(values, (value) => ({ value, label: getLabel(value) }))
}
