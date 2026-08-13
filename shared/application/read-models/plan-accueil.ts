import type { DemandeSubvention } from '@shared/application/domain/demande-subvention'
import type { Departement } from '@shared/application/domain/departement'
import type { Installation } from '@shared/application/domain/installation'
import type { Instruction } from '@shared/application/domain/instruction'
import type { ProgrammeAide } from '@shared/application/domain/programme-aide'
import type { Region } from '@shared/application/domain/region'
import type { DepartementsByRegion } from './departements-by-region'
import type { Plan } from './plan'

export type DemandeSubventionAccueil = {
    id: DemandeSubvention['id']
    programmeAide: ProgrammeAide
    instructions: readonly Instruction[]
}

export type PlanAccueil = Plan & {
    departement: Departement['dep'] | null
    installationRegion: Region['libelle'] | null
    demandesSubvention: readonly DemandeSubventionAccueil[]
}

export type PlanAccueilSources = {
    plans: readonly Plan[]
    installations: readonly Installation[]
    departementsByRegion: readonly DepartementsByRegion[]
    demandesSubvention: readonly DemandeSubvention[]
    programmesAide: readonly ProgrammeAide[]
    instructions: readonly Instruction[]
}

function getInstructionsBySubvention(
    instructions: readonly Instruction[]
): Map<DemandeSubvention['id'], Instruction[]> {
    const instructionsBySubvention = new Map<
        DemandeSubvention['id'],
        Instruction[]
    >()

    for (const instruction of instructions) {
        // An empty Ref reads as 0. Left in, every instruction whose demande
        // could not be resolved would group under the same key.
        if (instruction.subvention === 0) continue

        const group = instructionsBySubvention.get(instruction.subvention) ?? []
        group.push(instruction)
        instructionsBySubvention.set(instruction.subvention, group)
    }

    return instructionsBySubvention
}

function getDemandesByPlan({
    demandesSubvention,
    programmesAide,
    instructions,
}: Pick<
    PlanAccueilSources,
    'demandesSubvention' | 'programmesAide' | 'instructions'
>): Map<Plan['id'], DemandeSubventionAccueil[]> {
    const programmeById = new Map(
        programmesAide.map((programme) => [programme.id, programme])
    )

    const instructionsBySubvention = getInstructionsBySubvention(instructions)

    const demandesByPlan = new Map<Plan['id'], DemandeSubventionAccueil[]>()

    for (const demande of demandesSubvention) {
        // A demande is named by its programme, so one pointing at a programme
        // the document cannot name says nothing about the plan it was filed
        // for — neither an appel to filter on, nor a chronology to head.
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

export function getAppelsAProjet(
    plan: PlanAccueil
): ProgrammeAide['appelAProjet'][] {
    const appels = plan.demandesSubvention
        .map((demande) => demande.programmeAide.appelAProjet)
        .filter((appel) => appel !== '')

    return [...new Set(appels)]
}

export function getPlansAccueil({
    plans,
    installations,
    departementsByRegion,
    demandesSubvention,
    programmesAide,
    instructions,
}: PlanAccueilSources): PlanAccueil[] {
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
    })

    return plans.map((plan) => {
        const departement =
            installationById.get(plan.installation)?.commune.dep || null

        return {
            ...plan,
            departement,
            installationRegion:
                departement === null
                    ? null
                    : (regionByDepartement.get(departement) ?? null),
            demandesSubvention: demandesByPlan.get(plan.id) ?? [],
        }
    })
}
