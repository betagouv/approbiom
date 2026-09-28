import { describe, expect, it, vi } from 'vitest'
import type { DemandeSubvention } from '@shared/core/domain/entities/demande-subvention'
import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'
import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import {
    getAppelsAProjetByPlan,
    listPlans,
    type PlanViewPorts,
} from '@shared/core/application/services/plan-view'

function plan(overrides: Partial<Plan> = {}): Plan {
    return {
        id: 1,
        nom: 'RCU Val Fleuri',
        installation: 1,
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

function demande(
    overrides: Partial<DemandeSubvention> = {}
): DemandeSubvention {
    return { id: 1, programmeAide: 1, planDApprovisionnement: 1, ...overrides }
}

const bciat = programmeAide()
const bcib = programmeAide({ id: 2, appelAProjet: 'BCIB (2024)' })

function fakePorts() {
    const listDemandes = vi.fn(() =>
        Promise.resolve([demande(), demande({ id: 2, programmeAide: bcib.id })])
    )
    const listProgrammes = vi.fn(() => Promise.resolve([bciat, bcib]))

    const ports: PlanViewPorts = {
        plans: {
            list: () => Promise.resolve([plan(), plan({ id: 2 })]),
        },
        demandesSubvention: { list: listDemandes },
        programmesAide: { list: listProgrammes, update: vi.fn() },
    }

    return { ports, listDemandes, listProgrammes }
}

describe('getAppelsAProjetByPlan', () => {
    it('gathers the appels of every demande of a plan', () => {
        const appels = getAppelsAProjetByPlan(
            [demande(), demande({ id: 2, programmeAide: bcib.id })],
            [bciat, bcib]
        )

        expect(appels.get(1)).toEqual(['BCIAT (2023)', 'BCIB (2024)'])
    })

    it('lists an appel once when two demandes share it', () => {
        const appels = getAppelsAProjetByPlan(
            [demande(), demande({ id: 2 })],
            [bciat]
        )

        expect(appels.get(1)).toEqual(['BCIAT (2023)'])
    })

    it('skips blank appels and unknown programmes', () => {
        const appels = getAppelsAProjetByPlan(
            [
                demande({ programmeAide: 3 }),
                demande({ id: 2, programmeAide: 4 }),
            ],
            [programmeAide({ id: 3, appelAProjet: '' })]
        )

        expect(appels.get(1)).toBeUndefined()
    })
})

describe('listPlans', () => {
    it('returns the fields asked for, and only those', async () => {
        const plans = await listPlans(['id', 'nom'], fakePorts().ports)

        expect(plans).toEqual([
            { id: 1, nom: 'RCU Val Fleuri' },
            { id: 2, nom: 'RCU Val Fleuri' },
        ])
    })

    it('does not read the demandes when no appel is asked for', async () => {
        const { ports, listDemandes, listProgrammes } = fakePorts()

        await listPlans(['id', 'statut'], ports)

        expect(listDemandes).not.toHaveBeenCalled()
        expect(listProgrammes).not.toHaveBeenCalled()
    })

    it('resolves the appels à projet when asked for', async () => {
        const plans = await listPlans(
            ['id', 'appelsAProjet'],
            fakePorts().ports
        )

        expect(plans).toEqual([
            { id: 1, appelsAProjet: ['BCIAT (2023)', 'BCIB (2024)'] },
            { id: 2, appelsAProjet: [] },
        ])
    })

    it('needs only the plans port when no computed field is asked for', async () => {
        const { ports } = fakePorts()

        const plans = await listPlans(['id'], { plans: ports.plans })

        expect(plans).toEqual([{ id: 1 }, { id: 2 }])
    })

    // Checked by the compiler: the call below is an error, since the appels
    // need the demandes and the programmes.
    it('asks for the ports the fields need', async () => {
        const { ports } = fakePorts()

        await expect(
            // @ts-expect-error missing demandesSubvention and programmesAide
            listPlans(['id', 'appelsAProjet'], { plans: ports.plans })
        ).rejects.toThrow('demandesSubvention')
    })
})
