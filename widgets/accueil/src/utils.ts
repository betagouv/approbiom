import type { Departement } from '@shared/core/domain/value-objects/departement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import type { DepartementsByRegion } from '@shared/core/application/read-models/departements-by-region'
import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'
import { getAppelsAProjet, type PlanAccueil } from '@shared/core/plan-accueil'
import type {
    MultiSelectGroup,
    MultiSelectOption,
} from '@shared/user-interface/component/MultiSelect'
import type { SearchBarOption } from '@shared/user-interface/component/SearchBar'
import { getOptions } from '@shared/user-interface/utils/getOptions'

export const SANS_APPEL_A_PROJET_LABEL =
    "Aucun appel à projet n'est lié à ce plan"

const SANS_APPEL_A_PROJET_VALUE = ''

export type PlanFilters = {
    nom?: string
    statuts?: readonly string[]
    departements?: readonly Departement['dep'][]
    appelsAProjet?: readonly ProgrammeAide['appelAProjet'][]
    fournisseurs?: readonly Entreprise['siret'][]
}

function matchesSelection(
    selection: readonly string[],
    value: string | null
): boolean {
    return selection.length === 0 || selection.includes(value ?? '')
}

function matchesAnySelection(
    selection: readonly string[],
    values: readonly string[],
    emptyValue?: string
): boolean {
    if (selection.length === 0) return true

    return values.length === 0
        ? emptyValue !== undefined && selection.includes(emptyValue)
        : values.some((value) => selection.includes(value))
}

export function getFilteredRows(
    rows: readonly PlanAccueil[],
    {
        nom = '',
        statuts = [],
        departements = [],
        appelsAProjet = [],
        fournisseurs = [],
    }: PlanFilters = {}
): PlanAccueil[] {
    const query = nom.trim().toLowerCase()

    return rows.filter(
        (row) =>
            (query === '' || row.nom.toLowerCase().includes(query)) &&
            matchesSelection(statuts, row.statut) &&
            matchesSelection(departements, row.departement) &&
            matchesAnySelection(
                appelsAProjet,
                getAppelsAProjet(row),
                SANS_APPEL_A_PROJET_VALUE
            ) &&
            matchesAnySelection(
                fournisseurs,
                row.fournisseurs.map(({ siret }) => siret)
            )
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

export function getAppelAProjetOptions(
    programmesAide: readonly ProgrammeAide[]
): MultiSelectOption<ProgrammeAide['appelAProjet']>[] {
    const appels = getOptions(
        programmesAide,
        (programme) => programme.appelAProjet
    ).sort((a, b) => a.label.localeCompare(b.label, 'fr'))

    // Last, under the named appels: it is the answer to « none of them », not
    // one more of them.
    return [
        ...appels,
        { value: SANS_APPEL_A_PROJET_VALUE, label: SANS_APPEL_A_PROJET_LABEL },
    ]
}

export function getFournisseurOptions(
    rows: readonly PlanAccueil[]
): MultiSelectOption<Entreprise['siret']>[] {
    const labelBySiret = new Map<Entreprise['siret'], string>()

    for (const { fournisseurs } of rows)
        for (const { siret, denomination } of fournisseurs)
            labelBySiret.set(siret, denomination || siret)

    return [...labelBySiret]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
}
