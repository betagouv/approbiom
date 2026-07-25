import type { PlanDapprovisionnementAccueil } from '@shared/hooks/useGrist'
import type {
    MultiSelectGroup,
    MultiSelectOption,
} from '@shared/components/MultiSelect'

export type PlanFilters = {
    nom?: string
    statuts?: readonly string[]
    appelsAProjet?: readonly string[]
    lieux?: readonly string[]
}

function matchesSelection(
    selection: readonly string[],
    value: string | null
): boolean {
    return selection.length === 0 || selection.includes(value ?? '')
}

export function getFilteredRows(
    rows: readonly PlanDapprovisionnementAccueil[],
    { nom = '', statuts = [], appelsAProjet = [], lieux = [] }: PlanFilters = {}
): PlanDapprovisionnementAccueil[] {
    const query = nom.trim().toLowerCase()

    return rows.filter(
        (row) =>
            (query === '' || (row.Nom ?? '').toLowerCase().includes(query)) &&
            matchesSelection(statuts, row.Statut) &&
            matchesSelection(appelsAProjet, row.Appel_a_projet) &&
            matchesSelection(lieux, row.Departement_de_situation)
    )
}

function distinct(values: readonly (string | null)[]): string[] {
    return [
        ...new Set(
            values.filter((v): v is string => typeof v === 'string' && v !== '')
        ),
    ].sort((a, b) => a.localeCompare(b, 'fr'))
}

function asOptions(values: readonly string[]): MultiSelectOption<string>[] {
    return values.map((value) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1),
    }))
}

export function getStatutOptions(
    rows: readonly PlanDapprovisionnementAccueil[]
): MultiSelectOption<string>[] {
    return asOptions(distinct(rows.map((row) => row.Statut)))
}

export function getAppelAProjetOptions(
    rows: readonly PlanDapprovisionnementAccueil[]
): MultiSelectOption<string>[] {
    const options = asOptions(distinct(rows.map((row) => row.Appel_a_projet)))

    return rows.some((row) => (row.Appel_a_projet ?? '') === '')
        ? [...options, { value: '', label: 'Aucun' }]
        : options
}

// « Poitiers (86) » — what the communes are grouped by is the code in brackets.
const DEPARTEMENT = /\((\d+)\)\s*$/

export function getLieuOptions(
    rows: readonly PlanDapprovisionnementAccueil[]
): MultiSelectGroup<string>[] {
    const byDepartement = new Map<string, MultiSelectOption<string>[]>()

    for (const commune of distinct(
        rows.map((row) => row.Departement_de_situation)
    )) {
        // A commune written some other way becomes a group of its own rather
        // than being dropped: the filter still offers it, just ungrouped.
        const code = DEPARTEMENT.exec(commune)?.[1] ?? commune

        byDepartement.set(code, [
            ...(byDepartement.get(code) ?? []),
            { value: commune, label: commune },
        ])
    }

    // Grouping is what makes a long list usable — ticking a group ticks all the
    // communes of that département, which is how one filters by département
    // without the document ever storing one.
    return [...byDepartement]
        .sort(([a], [b]) => a.localeCompare(b, 'fr', { numeric: true }))
        .map(([code, options]) => ({
            id: code,
            label: DEPARTEMENT.test(`(${code})`) ? `Département ${code}` : code,
            options,
        }))
}
