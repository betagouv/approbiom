import { describe, expect, it } from 'vitest'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Crb } from '@shared/core/domain/entities/crb'
import type { DemandeSubvention } from '@shared/core/domain/entities/demande-subvention'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Instruction } from '@shared/core/domain/entities/instruction'
import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'

import {
    getAppelsAProjet,
    composePlanDetails,
    type PlanDetail,
    type PlanDetailSources,
} from '@shared/core/application/services/plan-detail'

import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'

function plan(overrides: Partial<Plan> = {}): Plan {
    return {
        id: 1,
        nom: 'RCU Val Fleuri',
        installation: 1,
        departement: null,
        typeDePlan: 'création',
        usage: 'énergie',
        natureDonnee: 'prévision',
        statut: 'projet',
        ...overrides,
    }
}

function programmeAide(overrides: Partial<ProgrammeAide> = {}): ProgrammeAide {
    return {
        id: 1,
        year: 2023,
        name: 'Biomasse Chaleur Industrie Agriculture Tertiaire',
        shortName: 'BCIAT',
        appelAProjet: 'BCIAT (2023)',
        laureat: null,
        ...overrides,
    }
}

/** The CRBs the instructions below point at, by the rowId each one holds. */
const crbs: readonly Crb[] = [
    { id: 1, name: 'Nouvelle Aquitaine' },
    { id: 2, name: 'Occitanie' },
    { id: 3, name: 'Bretagne' },
    { id: 4, name: 'Grand Est' },
]

function instruction(overrides: Partial<Instruction> = {}): Instruction {
    return {
        id: 1,
        crb: 1,
        subvention: 1,
        name: 'Instruction 1',
        avisCrbRequis: true,
        dateSaisineCrb: null,
        dateAvisCrb: null,
        avisCRB: 'En attente',
        dateAvisPrefet: null,
        avisPrefet: 'En attente',
        phase: "En cours d'instruction",
        ...overrides,
    }
}

const valFleuri = plan()
const clairVillage = plan({ id: 2, nom: 'RCU Clair-Village' })

const bciat = programmeAide()
const bcib = programmeAide({
    id: 2,
    shortName: 'BCIB',
    appelAProjet: 'BCIB (2024)',
})

const demandeBciat: DemandeSubvention = {
    id: 1,
    programmeAide: bciat.id,
    planDApprovisionnement: valFleuri.id,
}

const demandeBcib: DemandeSubvention = {
    id: 2,
    programmeAide: bcib.id,
    planDApprovisionnement: valFleuri.id,
}

// Same programme, another plan.
const demandeVoisine: DemandeSubvention = {
    id: 3,
    programmeAide: bciat.id,
    planDApprovisionnement: clairVillage.id,
}

const scieriePicard: Entreprise = {
    siret: '11111111111111',
    denomination: 'Scierie Picard',
}
const cooperativeDuBois: Entreprise = {
    siret: '22222222222222',
    denomination: 'Coopérative du Bois',
}

const nouvelleAquitaine = instruction()
const occitanie = instruction({ id: 2, crb: 2, name: 'Instruction 2' })
const bretagne = instruction({
    id: 3,
    crb: 3,
    name: 'Instruction 3',
    subvention: demandeBcib.id,
})
const voisine = instruction({
    id: 4,
    crb: 4,
    name: 'Instruction 4',
    subvention: demandeVoisine.id,
})

function sources(
    overrides: Partial<PlanDetailSources> = {}
): PlanDetailSources {
    return {
        plans: [valFleuri, clairVillage],
        departementsByRegion: [],
        demandesSubvention: [demandeBciat, demandeBcib, demandeVoisine],
        programmesAide: [bciat, bcib],
        instructions: [nouvelleAquitaine, occitanie, bretagne, voisine],
        crbs,
        approvisionnementsByFournisseur: [],
        entreprises: [scieriePicard, cooperativeDuBois],
        attachments: [],
        ...overrides,
    }
}

const attachmentsOf = (plans: readonly PlanDetail[], id: Plan['id']) =>
    plans.find((plan) => plan.id === id)?.attachments ?? []

function attachment(
    planDApprovisionnement: Plan['id'],
    id: number,
    name = `document-${id}.pdf`
): Attachment {
    return {
        id,
        planDApprovisionnement,
        type: 'Formulaire',
        name,
        sizeInBytes: 1024,
    }
}

const demandesOf = (plans: readonly PlanDetail[], id: Plan['id']) =>
    plans.find((plan) => plan.id === id)?.demandesSubvention ?? []

describe('composePlanDetails', () => {
    it('hangs one demande per programme the plan asked a subvention from', () => {
        expect(
            demandesOf(composePlanDetails(sources()), valFleuri.id).map(
                ({ programmeAide }) => programmeAide.shortName
            )
        ).toEqual(['BCIAT', 'BCIB'])
    })

    it('gathers the instructions of each demande under it', () => {
        const [premiere, seconde] = demandesOf(
            composePlanDetails(sources()),
            valFleuri.id
        )

        expect(premiere.instructions).toEqual([
            { ...nouvelleAquitaine, crbName: 'Nouvelle Aquitaine' },
            { ...occitanie, crbName: 'Occitanie' },
        ])
        expect(seconde.instructions).toEqual([
            { ...bretagne, crbName: 'Bretagne' },
        ])
    })

    it('reads no name for a CRB the document cannot name', () => {
        // The instruction still happened, so its chronology is kept — it just
        // reads with no CRB heading it.
        const inconnu = instruction({ crb: 99 })

        const [premiere] = demandesOf(
            composePlanDetails(sources({ instructions: [inconnu] })),
            valFleuri.id
        )

        expect(premiere.instructions).toEqual([{ ...inconnu, crbName: '' }])
    })

    it('leaves the demandes of every other plan where they are', () => {
        expect(
            demandesOf(composePlanDetails(sources()), valFleuri.id).flatMap(
                ({ instructions }) => instructions
            )
        ).not.toContainEqual({ ...voisine, crbName: 'Grand Est' })
    })

    it('reads nothing into a plan that carries no demande', () => {
        expect(
            demandesOf(
                composePlanDetails(sources({ demandesSubvention: [] })),
                valFleuri.id
            )
        ).toEqual([])
    })

    it('keeps two demandes filed under the same programme apart', () => {
        // Each one is instructed on its own, so each one heads a chronology.
        const secondeDemande: DemandeSubvention = { ...demandeBciat, id: 4 }
        const occitanieBis = instruction({ id: 5, crb: 2, subvention: 4 })

        const demandes = demandesOf(
            composePlanDetails(
                sources({
                    demandesSubvention: [demandeBciat, secondeDemande],
                    instructions: [nouvelleAquitaine, occitanieBis],
                })
            ),
            valFleuri.id
        )

        expect(demandes).toHaveLength(2)
        expect(demandes[1].instructions).toEqual([
            { ...occitanieBis, crbName: 'Occitanie' },
        ])
    })

    it('leaves out a demande whose programme cannot be named', () => {
        expect(
            demandesOf(
                composePlanDetails(sources({ programmesAide: [bcib] })),
                valFleuri.id
            )
        ).toHaveLength(1)
    })

    it('never hangs instructions on an unresolved demande', () => {
        // An empty Ref reads as 0 on both sides; matching them would gather
        // every orphaned instruction under the first such demande.
        const orpheline = instruction({ id: 6, crb: 5, subvention: 0 })

        expect(
            demandesOf(
                composePlanDetails(
                    sources({
                        demandesSubvention: [{ ...demandeBciat, id: 0 }],
                        instructions: [orpheline],
                    })
                ),
                valFleuri.id
            )[0].instructions
        ).toEqual([])
    })
})

describe('composePlanDetails, on the attachments', () => {
    it('hangs every document on the plan it is attached to', () => {
        const formulaire = attachment(valFleuri.id, 1)
        const plan = attachment(valFleuri.id, 2)
        const voisin = attachment(clairVillage.id, 3)

        const plans = composePlanDetails(
            sources({ attachments: [formulaire, plan, voisin] })
        )

        expect(attachmentsOf(plans, valFleuri.id)).toEqual([formulaire, plan])
        expect(attachmentsOf(plans, clairVillage.id)).toEqual([voisin])
    })

    it('leaves a plan nothing is attached to with nothing', () => {
        const plans = composePlanDetails(
            sources({ attachments: [attachment(clairVillage.id, 1)] })
        )

        expect(attachmentsOf(plans, valFleuri.id)).toEqual([])
    })
})

describe('getAppelsAProjet', () => {
    const appelsOf = (id: Plan['id']) => {
        const plans = composePlanDetails(sources())

        return getAppelsAProjet(plans.find((plan) => plan.id === id)!)
    }

    it('names every appel the plan’s demandes were filed under', () => {
        expect(appelsOf(valFleuri.id)).toEqual(['BCIAT (2023)', 'BCIB (2024)'])
    })

    it('names an appel once, however many demandes were filed under it', () => {
        expect(appelsOf(clairVillage.id)).toEqual(['BCIAT (2023)'])
    })

    it('reads no appel off a programme the document left without one', () => {
        const plans = composePlanDetails(
            sources({
                demandesSubvention: [demandeBciat],
                programmesAide: [programmeAide({ appelAProjet: '' })],
            })
        )

        expect(getAppelsAProjet(plans[0])).toEqual([])
    })
})
