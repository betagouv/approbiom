import type { Crb } from '@shared/core/domain/entities/crb'
import type { DemandeSubvention } from '@shared/core/domain/entities/demande-subvention'
import {
    codeDepartementOf,
    type Commune,
} from '@shared/core/domain/value-objects/commune'
import type { Departement } from '@shared/core/domain/value-objects/departement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Installation } from '@shared/core/domain/entities/installation'
import type { Instruction } from '@shared/core/domain/entities/instruction'
import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import type { Region } from '@shared/core/domain/value-objects/region'
import type { ApprovisionnementGroupedByPlanRessourceAndFournisseur } from '@shared/core/application/ports/approvisionnement'
import type { DepartementsByRegion } from '@shared/core/application/ports/referentiel-geo'
import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'
import type { ApprovisionnementPort } from '@shared/core/application/ports/approvisionnement'
import type { CrbPort } from '@shared/core/application/ports/crb'
import type { DemandeSubventionPort } from '@shared/core/application/ports/demande-subvention'
import type { EntreprisePort } from '@shared/core/application/ports/entreprise'
import type { ReferentielGeoPort } from '@shared/core/application/ports/referentiel-geo'
import type { InstallationPort } from '@shared/core/application/ports/installation'
import type { InstructionPort } from '@shared/core/application/ports/instruction'
import type { PlanPort } from '@shared/core/application/ports/plan-d-approvisionnement'
import type { ProgrammeAidePort } from '@shared/core/application/ports/programme-aide'

export type InstructionDetail = Instruction & {
    crbName: Crb['name']
}

export type DemandeSubventionDetail = {
    id: DemandeSubvention['id']
    programmeAide: ProgrammeAide
    instructions: readonly InstructionDetail[]
}

export type PlanDetail = Plan & {
    installationNom: Installation['nom'] | null
    communeDeSituation: Commune['codeInsee'] | null
    departementDeSituation: Departement['dep'] | null
    installationRegion: Region['libelle'] | null
    demandesSubvention: readonly DemandeSubventionDetail[]
    fournisseurs: readonly Entreprise[]
}

export type PlanDetailSources = {
    plans: readonly Plan[]
    installations: readonly Installation[]
    departementsByRegion: readonly DepartementsByRegion[]
    demandesSubvention: readonly DemandeSubvention[]
    programmesAide: readonly ProgrammeAide[]
    instructions: readonly Instruction[]
    crbs: readonly Crb[]
    approvisionnementsByFournisseur: readonly ApprovisionnementGroupedByPlanRessourceAndFournisseur[]
    entreprises: readonly Entreprise[]
}

function getInstructionsBySubvention(
    instructions: readonly Instruction[],
    crbs: readonly Crb[]
): Map<DemandeSubvention['id'], InstructionDetail[]> {
    const crbById = new Map(crbs.map((crb) => [crb.id, crb]))

    const instructionsBySubvention = new Map<
        DemandeSubvention['id'],
        InstructionDetail[]
    >()

    for (const instruction of instructions) {
        // An empty Ref reads as 0.
        if (instruction.subvention === 0) continue

        const group = instructionsBySubvention.get(instruction.subvention) ?? []
        group.push({
            ...instruction,
            crbName: crbById.get(instruction.crb)?.name ?? '',
        })
        instructionsBySubvention.set(instruction.subvention, group)
    }

    return instructionsBySubvention
}

function getDemandesByPlan({
    demandesSubvention,
    programmesAide,
    instructions,
    crbs,
}: Pick<
    PlanDetailSources,
    'demandesSubvention' | 'programmesAide' | 'instructions' | 'crbs'
>): Map<Plan['id'], DemandeSubventionDetail[]> {
    const programmeById = new Map(
        programmesAide.map((programme) => [programme.id, programme])
    )

    const instructionsBySubvention = getInstructionsBySubvention(
        instructions,
        crbs
    )

    const demandesByPlan = new Map<Plan['id'], DemandeSubventionDetail[]>()

    for (const demande of demandesSubvention) {
        const programmeAide = programmeById.get(demande.programmeAide)
        if (programmeAide === undefined) continue

        const demandes =
            demandesByPlan.get(demande.planDApprovisionnement) ?? []
        demandes.push({
            id: demande.id,
            programmeAide,
            instructions: instructionsBySubvention.get(demande.id) ?? [],
        })

        demandesByPlan.set(demande.planDApprovisionnement, demandes)
    }

    return demandesByPlan
}

function getFournisseursByPlan({
    approvisionnementsByFournisseur,
    entreprises,
}: Pick<
    PlanDetailSources,
    'approvisionnementsByFournisseur' | 'entreprises'
>): Map<Plan['id'], Entreprise[]> {
    const entrepriseBySiret = new Map(
        entreprises.map((entreprise) => [entreprise.siret, entreprise])
    )

    const fournisseursByPlan = new Map<Plan['id'], Entreprise[]>()

    for (const {
        planDApprovisionnement,
        fournisseur,
    } of approvisionnementsByFournisseur) {
        if (fournisseur === undefined) continue

        const fournisseurs =
            fournisseursByPlan.get(planDApprovisionnement) ?? []
        // The summary has one row per ressource, so a fournisseur can repeat.
        if (fournisseurs.some(({ siret }) => siret === fournisseur)) continue

        fournisseurs.push(
            entrepriseBySiret.get(fournisseur) ?? {
                siret: fournisseur,
                denomination: '',
            }
        )

        fournisseursByPlan.set(planDApprovisionnement, fournisseurs)
    }

    return fournisseursByPlan
}

export function getAppelsAProjet(
    plan: PlanDetail
): ProgrammeAide['appelAProjet'][] {
    const appels = plan.demandesSubvention
        .map((demande) => demande.programmeAide.appelAProjet)
        .filter((appel) => appel !== '')

    return [...new Set(appels)]
}

export function composePlanDetails({
    plans,
    installations,
    departementsByRegion,
    demandesSubvention,
    programmesAide,
    instructions,
    crbs,
    approvisionnementsByFournisseur,
    entreprises,
}: PlanDetailSources): PlanDetail[] {
    const installationById = new Map(
        installations.map((installation) => [installation.id, installation])
    )

    const regionByDepartement = new Map<Departement['dep'], Region['libelle']>()
    for (const { region, departements } of departementsByRegion)
        for (const departement of departements)
            regionByDepartement.set(departement.dep, region.libelle)

    const demandesByPlan = getDemandesByPlan({
        demandesSubvention,
        programmesAide,
        instructions,
        crbs,
    })

    const fournisseursByPlan = getFournisseursByPlan({
        approvisionnementsByFournisseur,
        entreprises,
    })

    return plans.map((plan) => {
        const installation = installationById.get(plan.installation)
        const commune = installation?.commune ?? ''
        const departementDeSituation = codeDepartementOf(commune) ?? null

        return {
            ...plan,
            installationNom: installation?.nom || null,
            communeDeSituation: commune === '' ? null : commune,
            departementDeSituation,
            installationRegion:
                departementDeSituation === null
                    ? null
                    : (regionByDepartement.get(departementDeSituation) ?? null),
            demandesSubvention: demandesByPlan.get(plan.id) ?? [],
            fournisseurs: fournisseursByPlan.get(plan.id) ?? [],
        }
    })
}

export type PlanDetailPorts = {
    plans: PlanPort
    installations: InstallationPort
    listDepartementsByRegion: ReferentielGeoPort['listDepartementsByRegion']
    demandesSubvention: DemandeSubventionPort
    programmesAide: ProgrammeAidePort
    instructions: InstructionPort
    crbs: CrbPort
    approvisionnements: ApprovisionnementPort
    entreprises: EntreprisePort
}

/** Reads must stay concurrent: adapters share a table fetch only while both are in flight. */
export async function getPlanDetails(
    ports: PlanDetailPorts
): Promise<readonly PlanDetail[]> {
    const [
        plans,
        installations,
        departementsByRegion,
        demandesSubvention,
        programmesAide,
        instructions,
        crbs,
        approvisionnementsByFournisseur,
        entreprises,
    ] = await Promise.all([
        ports.plans.list(),
        ports.installations.list(),
        ports.listDepartementsByRegion(),
        ports.demandesSubvention.list(),
        ports.programmesAide.list(),
        ports.instructions.list(),
        ports.crbs.list(),
        ports.approvisionnements.listGroupedByPlanRessourceAndFournisseur(),
        ports.entreprises.list(),
    ])

    return composePlanDetails({
        plans,
        installations,
        departementsByRegion,
        demandesSubvention,
        programmesAide,
        instructions,
        crbs,
        approvisionnementsByFournisseur,
        entreprises,
    })
}
