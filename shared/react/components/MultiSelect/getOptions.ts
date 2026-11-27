import type { MultiSelectOption } from '@shared/react/components/MultiSelect'

/**
 * Builds deduplicated MultiSelect options from rows, in first-seen order.
 * Empty values are dropped; a filter that must offer them needs its own option (see `getAppelAProjetOptions`).
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
