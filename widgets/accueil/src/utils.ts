import type { Plan } from '@shared/application/read-models/plan'
import type { MultiSelectOption } from '@shared/components/MultiSelect'
import { getOptions } from '@shared/utils/getOptions'

export type PlanFilters = {
    nom?: string
    statuts?: readonly string[]
}

function matchesSelection(
    selection: readonly string[],
    value: string | null
): boolean {
    return selection.length === 0 || selection.includes(value ?? '')
}

export function getFilteredRows(
    rows: readonly Plan[],
    { nom = '', statuts = [] }: PlanFilters = {}
): Plan[] {
    const query = nom.trim().toLowerCase()

    return rows.filter(
        (row) =>
            (query === '' || row.nom.toLowerCase().includes(query)) &&
            matchesSelection(statuts, row.statut)
    )
}

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1)
}

export function getStatutOptions(
    rows: readonly Plan[]
): MultiSelectOption<string>[] {
    return getOptions(rows, (row) => row.statut, capitalize).sort((a, b) =>
        a.label.localeCompare(b.label, 'fr')
    )
}
