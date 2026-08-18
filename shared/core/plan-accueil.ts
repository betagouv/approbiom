import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { DemandeSubvention } from '@shared/core/domain/entities/demande-subvention'
import type { Departement } from '@shared/core/domain/value-objects/departement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Installation } from '@shared/core/domain/entities/installation'
import type { Instruction } from '@shared/core/domain/entities/instruction'
import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import type { Region } from '@shared/core/domain/value-objects/region'
import type { ApprovisionnementByPlanRessourceAndFournisseur } from '@shared/core/application/read-models/approvisionnement-by-plan-ressource-and-fournisseur'
import type { DepartementsByRegion } from '@shared/core/application/read-models/departements-by-region'
import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'

export type DemandeSubventionAccueil = {
    id: DemandeSubvention['id']
    programmeAide: ProgrammeAide
    instructions: readonly Instruction[]
}

export type PlanAccueil = Plan & {
    departement: Departement['dep'] | null
    installationRegion: Region['libelle'] | null
    demandesSubvention: readonly DemandeSubventionAccueil[]
    fournisseurs: readonly Entreprise[]
    attachments: readonly Attachment[]
}

export type PlanAccueilSources = {
    plans: readonly Plan[]
    installations: readonly Installation[]
    departementsByRegion: readonly DepartementsByRegion[]
    demandesSubvention: readonly DemandeSubvention[]
    programmesAide: readonly ProgrammeAide[]
    instructions: readonly Instruction[]
    approvisionnementsByFournisseur: readonly ApprovisionnementByPlanRessourceAndFournisseur[]
    entreprises: readonly Entreprise[]
    attachments: readonly Attachment[]
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

function getFournisseursByPlan({
    approvisionnementsByFournisseur,
    entreprises,
}: Pick<
    PlanAccueilSources,
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
        // An approvisionnement whose fournisseur the document left empty names
        // nobody to filter on.
        if (fournisseur === '') continue

        const fournisseurs =
            fournisseursByPlan.get(planDApprovisionnement) ?? []
        // The summary carries one row per ressource, so a fournisseur comes
        // back as many times as it supplies the plan with one.
        if (fournisseurs.some(({ siret }) => siret === fournisseur)) continue

        // A siret the directory does not name is still a fournisseur: it is
        // read by its siret rather than dropped.
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

function getAttachmentsByPlan(
    attachments: readonly Attachment[]
): Map<Plan['id'], Attachment[]> {
    const attachmentsByPlan = new Map<Plan['id'], Attachment[]>()

    for (const attachment of attachments) {
        const attached =
            attachmentsByPlan.get(attachment.planDApprovisionnement) ?? []
        attached.push(attachment)

        attachmentsByPlan.set(attachment.planDApprovisionnement, attached)
    }

    return attachmentsByPlan
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
    approvisionnementsByFournisseur,
    entreprises,
    attachments,
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

    const fournisseursByPlan = getFournisseursByPlan({
        approvisionnementsByFournisseur,
        entreprises,
    })

    const attachmentsByPlan = getAttachmentsByPlan(attachments)

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
            fournisseurs: fournisseursByPlan.get(plan.id) ?? [],
            attachments: attachmentsByPlan.get(plan.id) ?? [],
        }
    })
}
