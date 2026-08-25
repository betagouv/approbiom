import type {
    ApprovisionnementGroupedByPlanAndRessource,
    ApprovisionnementGroupedByPlanRessourceAndFournisseur,
    ApprovisionnementGroupedByPlanRessourceAndProvenance,
    ApprovisionnementGroupedByPlanRessourceAndRegionOuPays,
    ApprovisionnementPort,
} from '@shared/core/application/ports/approvisionnement'
import type {
    DepartementsByRegion,
    InseePort,
} from '@shared/core/application/ports/insee'
import type { EntreprisePort } from '@shared/core/application/ports/entreprise'
import type { RessourcePort } from '@shared/core/application/ports/ressource'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'
import type { Ressource } from '@shared/core/domain/entities/ressource'

const UNKNOWN = 'Inconnu'

/**
 * One group of a breakdown, ready to be read: the dimension is a label, not a
 * code, so nothing downstream has a directory left to consult.
 */
export type Group = {
    label: string
    tonnageTotal: number
    repartition: number
}

export type ApprovisionnementStatsByRessource = {
    ressource: Ressource
    tonnageTotal: number
    /** Share of the plan's total drawn as this ressource, between 0 and 1. */
    repartition: number
    byRegionOuPays: readonly Group[]
    byProvenance: readonly Group[]
    byFournisseur: readonly Group[]
}

export type ApprovisionnementByRessourceStats =
    readonly ApprovisionnementStatsByRessource[]

export type ApprovisionnementByRessourceStatsPorts = {
    approvisionnements: ApprovisionnementPort
    ressources: RessourcePort
    entreprises: EntreprisePort
    insee: Pick<InseePort, 'listDepartementsByRegion'>
}

export type ApprovisionnementByRessourceStatsSources = {
    plan: Plan['id']
    totals: readonly ApprovisionnementGroupedByPlanAndRessource[]
    byRegionOuPays: readonly ApprovisionnementGroupedByPlanRessourceAndRegionOuPays[]
    byProvenance: readonly ApprovisionnementGroupedByPlanRessourceAndProvenance[]
    byFournisseur: readonly ApprovisionnementGroupedByPlanRessourceAndFournisseur[]
    ressources: readonly Ressource[]
    entreprises: readonly Entreprise[]
    departementsByRegion: readonly DepartementsByRegion[]
}

export type ApprovisionnementByRessourceStatsByPlan = ReadonlyMap<
    Plan['id'],
    ApprovisionnementByRessourceStats
>

export type ApprovisionnementByRessourceStatsByPlanSources = Omit<
    ApprovisionnementByRessourceStatsSources,
    'plan'
>

function groupsByRessource<
    T extends ApprovisionnementGroupedByPlanAndRessource,
>(
    rows: readonly T[],
    label: (row: T) => string
): Map<Ressource['code'], Group[]> {
    const byRessource = new Map<Ressource['code'], Group[]>()

    for (const row of rows) {
        const groups = byRessource.get(row.ressource) ?? []

        groups.push({
            label: label(row) || UNKNOWN,
            tonnageTotal: row.tonnageTotal,
            repartition: row.repartition,
        })

        byRessource.set(row.ressource, groups)
    }

    return byRessource
}

function rowsByPlan<T extends ApprovisionnementGroupedByPlanAndRessource>(
    rows: readonly T[]
): Map<Plan['id'], T[]> {
    const byPlan = new Map<Plan['id'], T[]>()

    for (const row of rows) {
        const planRows = byPlan.get(row.planDApprovisionnement) ?? []

        planRows.push(row)

        byPlan.set(row.planDApprovisionnement, planRows)
    }

    return byPlan
}

export function composeApprovisionnementStats({
    plan,
    totals,
    byRegionOuPays,
    byProvenance,
    byFournisseur,
    ressources,
    entreprises,
    departementsByRegion,
}: ApprovisionnementByRessourceStatsSources): ApprovisionnementByRessourceStats {
    const titleByCode = new Map(
        ressources.map(({ code, title }) => [code, title])
    )

    const nameBySiret = new Map(
        entreprises.map(({ siret, denomination }) => [siret, denomination])
    )

    const labelByDep = new Map(
        departementsByRegion.flatMap(({ departements }) =>
            departements.map(({ dep, libelle }) => [dep, libelle] as const)
        )
    )

    const forPlan = <T extends ApprovisionnementGroupedByPlanAndRessource>(
        rows: readonly T[]
    ) => rows.filter((row) => row.planDApprovisionnement === plan)

    const regionsOuPays = groupsByRessource(
        forPlan(byRegionOuPays),
        (row) => row.regionOuPays
    )

    const provenances = groupsByRessource(
        forPlan(byProvenance),
        (row) => labelByDep.get(row.provenance) || row.provenance
    )

    const fournisseurs = groupsByRessource(
        forPlan(byFournisseur),
        (row) => nameBySiret.get(row.fournisseur) || row.fournisseur
    )

    const totalsForPlan = forPlan(totals)

    const approvisionnementStatsByRessource = totalsForPlan.map(
        ({ ressource: code, tonnageTotal, repartition }) => ({
            // A ressource the directory does not name is still drawn on:
            // it is read by its code rather than left blank.
            ressource: { code, title: titleByCode.get(code) || code },
            tonnageTotal,
            repartition,
            byRegionOuPays: regionsOuPays.get(code) ?? [],
            byProvenance: provenances.get(code) ?? [],
            byFournisseur: fournisseurs.get(code) ?? [],
        })
    )

    return approvisionnementStatsByRessource
}

/**
 * The same reading as {@link composeApprovisionnementStats}, composed for every
 * plan the totals speak of, in the order they first name them.
 */
export function composeApprovisionnementStatsByPlan({
    totals,
    byRegionOuPays,
    byProvenance,
    byFournisseur,
    ...directories
}: ApprovisionnementByRessourceStatsByPlanSources): ApprovisionnementByRessourceStatsByPlan {
    // Each plan is composed from its own rows alone, so the whole reading costs
    // one pass over the sources rather than one pass per plan.
    const totalsByPlan = rowsByPlan(totals)
    const regionsOuPaysByPlan = rowsByPlan(byRegionOuPays)
    const provenancesByPlan = rowsByPlan(byProvenance)
    const fournisseursByPlan = rowsByPlan(byFournisseur)

    return new Map(
        [...totalsByPlan].map(([plan, planTotals]) => [
            plan,
            composeApprovisionnementStats({
                plan,
                totals: planTotals,
                byRegionOuPays: regionsOuPaysByPlan.get(plan) ?? [],
                byProvenance: provenancesByPlan.get(plan) ?? [],
                byFournisseur: fournisseursByPlan.get(plan) ?? [],
                ...directories,
            }),
        ])
    )
}

async function loadApprovisionnementStatsSources(
    ports: ApprovisionnementByRessourceStatsPorts
): Promise<ApprovisionnementByRessourceStatsByPlanSources> {
    const [
        totals,
        byRegionOuPays,
        byProvenance,
        byFournisseur,
        ressources,
        entreprises,
        departementsByRegion,
    ] = await Promise.all([
        ports.approvisionnements.listGroupedByPlanAndRessource(),
        ports.approvisionnements.listGroupedByPlanRessourceAndRegionOuPays(),
        ports.approvisionnements.listGroupedByPlanRessourceAndProvenance(),
        ports.approvisionnements.listGroupedByPlanRessourceAndFournisseur(),
        ports.ressources.list(),
        ports.entreprises.list(),
        ports.insee.listDepartementsByRegion(),
    ])

    return {
        totals,
        byRegionOuPays,
        byProvenance,
        byFournisseur,
        ressources,
        entreprises,
        departementsByRegion,
    }
}

export async function getApprovisionnementByRessourceStats(
    ports: ApprovisionnementByRessourceStatsPorts,
    plan: Plan['id']
): Promise<ApprovisionnementByRessourceStats> {
    return composeApprovisionnementStats({
        plan,
        ...(await loadApprovisionnementStatsSources(ports)),
    })
}

export async function getApprovisionnementByRessourceStatsByPlan(
    ports: ApprovisionnementByRessourceStatsPorts
): Promise<ApprovisionnementByRessourceStatsByPlan> {
    return composeApprovisionnementStatsByPlan(
        await loadApprovisionnementStatsSources(ports)
    )
}
