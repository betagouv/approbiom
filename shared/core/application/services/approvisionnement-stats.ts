import type {
    ApprovisionnementGroupedByPlanAndRessource,
    ApprovisionnementGroupedByPlanRessourceAndDepartement,
    ApprovisionnementGroupedByPlanRessourceAndFournisseur,
    ApprovisionnementGroupedByPlanRessourceAndRegion,
    ApprovisionnementQuery,
} from '@shared/core/application/ports/approvisionnement'
import type {
    DepartementsByRegion,
    InseeQuery,
} from '@shared/core/application/ports/insee'
import type { EntrepriseQuery } from '@shared/core/application/ports/entreprise'
import type { RessourceQuery } from '@shared/core/application/ports/ressource'
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
    byRegion: readonly Group[]
    byDepartement: readonly Group[]
    byFournisseur: readonly Group[]
}

export type ApprovisionnementStats = {
    plan: Plan['id']
    tonnageTotal: number
    byRessource: readonly ApprovisionnementStatsByRessource[]
}

export type ApprovisionnementStatsPorts = {
    approvisionnements: ApprovisionnementQuery
    ressources: RessourceQuery
    entreprises: EntrepriseQuery
    insee: InseeQuery
}

export type ApprovisionnementStatsSources = {
    plan: Plan['id']
    totals: readonly ApprovisionnementGroupedByPlanAndRessource[]
    byRegion: readonly ApprovisionnementGroupedByPlanRessourceAndRegion[]
    byDepartement: readonly ApprovisionnementGroupedByPlanRessourceAndDepartement[]
    byFournisseur: readonly ApprovisionnementGroupedByPlanRessourceAndFournisseur[]
    ressources: readonly Ressource[]
    entreprises: readonly Entreprise[]
    departementsByRegion: readonly DepartementsByRegion[]
}

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

export function composeApprovisionnementStats({
    plan,
    totals,
    byRegion,
    byDepartement,
    byFournisseur,
    ressources,
    entreprises,
    departementsByRegion,
}: ApprovisionnementStatsSources): ApprovisionnementStats {
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

    const regions = groupsByRessource(forPlan(byRegion), (row) => row.region)

    const departements = groupsByRessource(
        forPlan(byDepartement),
        (row) => labelByDep.get(row.departement) || row.departement
    )

    const fournisseurs = groupsByRessource(
        forPlan(byFournisseur),
        (row) => nameBySiret.get(row.fournisseur) || row.fournisseur
    )

    const totalsForPlan = forPlan(totals)

    return {
        plan,
        tonnageTotal: totalsForPlan.reduce(
            (sum, row) => sum + row.tonnageTotal,
            0
        ),
        byRessource: totalsForPlan.map(
            ({ ressource: code, tonnageTotal, repartition }) => ({
                // A ressource the directory does not name is still drawn on:
                // it is read by its code rather than left blank.
                ressource: { code, title: titleByCode.get(code) || code },
                tonnageTotal,
                repartition,
                byRegion: regions.get(code) ?? [],
                byDepartement: departements.get(code) ?? [],
                byFournisseur: fournisseurs.get(code) ?? [],
            })
        ),
    }
}

export async function getApprovisionnementStats(
    ports: ApprovisionnementStatsPorts,
    plan: Plan['id']
): Promise<ApprovisionnementStats> {
    const [
        totals,
        byRegion,
        byDepartement,
        byFournisseur,
        ressources,
        entreprises,
        departementsByRegion,
    ] = await Promise.all([
        ports.approvisionnements.listGroupedByPlanAndRessource(),
        ports.approvisionnements.listGroupedByPlanRessourceAndRegion(),
        ports.approvisionnements.listGroupedByPlanRessourceAndDepartement(),
        ports.approvisionnements.listGroupedByPlanRessourceAndFournisseur(),
        ports.ressources.list(),
        ports.entreprises.list(),
        ports.insee.listDepartementsByRegion(),
    ])

    return composeApprovisionnementStats({
        plan,
        totals,
        byRegion,
        byDepartement,
        byFournisseur,
        ressources,
        entreprises,
        departementsByRegion,
    })
}
