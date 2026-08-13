import type { Departement } from '@shared/application/domain/departement'
import type { DepartementsByRegion } from '@shared/application/read-models/departements-by-region'
import type { Plan } from '@shared/application/read-models/plan'
import type { PlanAccueil } from '@shared/application/read-models/plan-accueil'
import type {
    MultiSelectGroup,
    MultiSelectOption,
} from '@shared/components/MultiSelect'
import type { SearchBarOption } from '@shared/components/SearchBar'
import { getOptions } from '@shared/utils/getOptions'

export type PlanFilters = {
    nom?: string
    statuts?: readonly string[]
    departements?: readonly Departement['dep'][]
}

function matchesSelection(
    selection: readonly string[],
    value: string | null
): boolean {
    return selection.length === 0 || selection.includes(value ?? '')
}

export function getFilteredRows(
    rows: readonly PlanAccueil[],
    { nom = '', statuts = [], departements = [] }: PlanFilters = {}
): PlanAccueil[] {
    const query = nom.trim().toLowerCase()

    return rows.filter(
        (row) =>
            (query === '' || row.nom.toLowerCase().includes(query)) &&
            matchesSelection(statuts, row.statut) &&
            matchesSelection(departements, row.departement)
    )
}

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1)
}

export function getDossierOptions(
    rows: readonly Plan[]
): SearchBarOption<string>[] {
    return getOptions(rows, (row) => row.nom)
}

export function getDepartementOptions(
    departementsByRegion: readonly DepartementsByRegion[]
): MultiSelectGroup<Departement['dep']>[] {
    return departementsByRegion
        .toSorted((a, b) =>
            a.region.libelle.localeCompare(b.region.libelle, 'fr')
        )
        .map(({ region, departements }) => ({
            id: region.reg,
            label: region.libelle,
            options: departements.map(({ dep }) => ({
                value: dep,
                label: dep,
            })),
        }))
}

export function getStatutOptions(
    rows: readonly Plan[]
): MultiSelectOption<string>[] {
    return getOptions(rows, (row) => row.statut, capitalize).sort((a, b) =>
        a.label.localeCompare(b.label, 'fr')
    )
}
