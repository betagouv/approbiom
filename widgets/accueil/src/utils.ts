import type {
    CrbAccueil,
    DemandeSubventionAccueil,
    InstructionCrbAccueil,
    PlanDapprovisionnementAccueil,
} from './grist'
import type { MultiSelectOption } from '@shared/components/MultiSelect'

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

// « Poitiers (86) » — the code in brackets is the only département the document
// stores, so it is what a selected département is matched against. Corsica is
// written 2A/2B and the overseas départements on three digits, hence the alternative.
const DEPARTEMENT = /\((2[AB]|\d{2,3})\)\s*$/

function getDepartementCode(lieu: string | null): string {
    return DEPARTEMENT.exec(lieu ?? '')?.[1] ?? ''
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
            matchesSelection(
                lieux,
                getDepartementCode(row.Departement_de_situation)
            )
    )
}

// French keeps the singular below two — « 0 résultat », « 1 résultat », then
// « 2 résultats ».
export function getResultCountLabel(count: number): string {
    return `${count} résultat${count > 1 ? 's' : ''}`
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
        ? [...options, { value: '', label: 'Non renseigné' }]
        : options
}

// « est Lauréat » is stored as a word, not as a Grist boolean, so the answer is
// read rather than tested. Anything that spells out yes counts; everything else
// — « non », an empty cell, a wording we have not seen — does not, which is what
// keeps an unexpected value from lighting up a tag that says the plan won.
const OUI = new Set(['oui', 'vrai', 'true', 'x', '1'])

export function isLaureat(estLaureat: string): boolean {
    return OUI.has(estLaureat.trim().toLowerCase())
}

// A Ref column holds the rowId of the row it points at, but Grist types it
// loosely and a reference to nothing comes back as 0 or as false. Row ids start
// at 1, so anything below that is « points at nothing » rather than a row.
function asRowId(ref: number | boolean): number | null {
    return typeof ref === 'number' && ref >= 1 ? ref : null
}

// A Grist date is a number of seconds since the epoch, and anything else in the
// cell — an empty date, the `false` an unset cell can come back as — means the
// step has not happened.
export function asDate(value: number | boolean | null): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/**
 * Formats a Grist date the way a French form writes one: « 12/03/2024 ».
 *
 * Read back in UTC, because that is where Grist puts it: a date carries no time
 * of day, and letting the browser shift it into its own timezone would show the
 * day before to anyone west of Greenwich.
 */
export function formatDate(secondes: number): string {
    return new Date(secondes * 1000).toLocaleDateString('fr-FR', {
        timeZone: 'UTC',
    })
}

export function getDerniereEtapeFaite(
    dates: readonly (number | null)[]
): number {
    return dates.reduce<number>(
        (derniere, date, index) => (date === null ? derniere : index),
        -1
    )
}

export type FilInstruction = {
    id: number
    // Name of the CRB instructing it, empty when the instruction names none.
    crb: string
    // What the document computes from the dates below; empty when it could not.
    phase: string
    dateSaisineCrb: number | null
    dateAvisCrb: number | null
    dateAvisPrefet: number | null
}

export type DemandeSubvention = {
    id: number
    fils: readonly FilInstruction[]
}

export function getDemandesSubventionByPlanId(
    demandesSubvention: readonly DemandeSubventionAccueil[],
    instructions: readonly InstructionCrbAccueil[],
    crbs: readonly CrbAccueil[]
): Map<number, DemandeSubvention[]> {
    const nomCrbById = new Map(crbs.map((crb) => [crb.id, crb.Nom]))

    const filsByDemandeId = new Map<number, FilInstruction[]>()

    for (const instruction of instructions) {
        const demandeId = asRowId(instruction.subvention)

        // An instruction attached to no demande belongs nowhere on the panel,
        // so there is nowhere to show it.
        if (demandeId === null) continue

        const crbId = asRowId(instruction.crb)

        filsByDemandeId.set(demandeId, [
            ...(filsByDemandeId.get(demandeId) ?? []),
            {
                id: instruction.id,
                crb: (crbId === null
                    ? ''
                    : (nomCrbById.get(crbId) ?? '')
                ).trim(),
                phase: instruction.Phase_de_l_instruction?.trim() ?? '',
                dateSaisineCrb: asDate(instruction.Date_saisine_CRB),
                dateAvisCrb: asDate(instruction.Date_avis_CRB),
                dateAvisPrefet: asDate(instruction.Date_avis_Prefet),
            },
        ])
    }

    const demandesByPlanId = new Map<number, DemandeSubvention[]>()

    for (const demande of demandesSubvention) {
        const planId = asRowId(demande.Plan_d_approvisionnement)
        if (planId === null) continue

        demandesByPlanId.set(planId, [
            ...(demandesByPlanId.get(planId) ?? []),
            {
                id: demande.id,
                fils: filsByDemandeId.get(demande.id) ?? [],
            },
        ])
    }

    return demandesByPlanId
}

export function getPhasesInstruction(
    demandesSubvention: readonly DemandeSubvention[]
): readonly string[] {
    return demandesSubvention
        .flatMap((demande) => demande.fils)
        .map((fil) => fil.phase)
        .filter((phase) => phase !== '')
}
