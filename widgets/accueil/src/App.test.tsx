import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
    AccessDeniedError,
    DataSourceUnavailableError,
} from '@shared/core/errors'
import type { InstructionPort } from '@shared/core/application/ports/instruction'
import type { ProgrammeAidePort } from '@shared/core/application/ports/programme-aide'
import type { PlanPort } from '@shared/core/application/ports/plan-d-approvisionnement'
import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'
import type { Crb } from '@shared/core/domain/entities/crb'
import type { DemandeSubvention } from '@shared/core/domain/entities/demande-subvention'
import type { Instruction } from '@shared/core/domain/entities/instruction'
import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import type { DepartementsByRegion } from '@shared/core/application/ports/insee'
import App from './App'
import type { AccueilPorts } from './load-accueil'

const rows =
    <T,>(value: readonly T[]) =>
    () =>
        Promise.resolve(value)

const planPort = (list: PlanPort['list']): PlanPort => ({ list })

// These tests read the accueil; none of them takes a path that writes. A write
// reaching the port is the test having gone somewhere it did not mean to, so it
// is refused rather than quietly answered.
const instructionPort = (
    list: InstructionPort['list'] = rows([])
): InstructionPort => ({
    list,
    update: () =>
        Promise.reject(new Error('no instruction is written by these tests')),
})

const programmeAidePort = (
    list: ProgrammeAidePort['list'] = rows([])
): ProgrammeAidePort => ({
    list,
    update: () =>
        Promise.reject(
            new Error("no programme d'aide is written by these tests")
        ),
})

function fakePorts(overrides: Partial<AccueilPorts> = {}): AccueilPorts {
    return {
        plans: { list: rows([]) },
        approvisionnements: {
            list: rows([]),
            listGroupedByPlanAndRessource: rows([]),
            listGroupedByPlanRessourceAndRegion: rows([]),
            listGroupedByPlanRessourceAndDepartement: rows([]),
            listGroupedByPlanRessourceAndFournisseur: rows([]),
        },
        ressources: { list: rows([]) },
        entreprises: { list: rows([]) },
        insee: { listDepartementsByRegion: rows([]) },
        demandesSubvention: { list: rows([]) },
        programmesAide: programmeAidePort(),
        instructions: instructionPort(),
        crbs: { list: rows([]) },
        attachments: {
            list: rows([]),
            getFileUrl: () => Promise.resolve(''),
        },
        ...overrides,
    }
}

const saintJunien: Plan = {
    id: 1,
    nom: 'RC Saint Junien',
    installation: 1,
    // The département the document computes from the installation's commune —
    // « 87 » is Saint-Junien's, and the chain the header's « Région » follows.
    departement: '87',
    typeDePlan: 'création',
    usage: 'énergie',
    natureDonnee: 'prévision',
    statut: 'en fonctionnement',
}

const bciat: ProgrammeAide = {
    id: 1,
    year: 2023,
    name: 'Biomasse Chaleur Industrie Agriculture Tertiaire',
    shortName: 'BCIAT',
    appelAProjet: 'BCIAT (2023)',
    laureat: null,
}

const nouvelleAquitaineInsee: DepartementsByRegion = {
    region: { reg: '75', libelle: 'Nouvelle-Aquitaine' },
    departements: [{ dep: '87', libelle: 'Haute-Vienne' }],
}

const demandeBciat: DemandeSubvention = {
    id: 1,
    programmeAide: bciat.id,
    planDApprovisionnement: saintJunien.id,
}

const crbNouvelleAquitaine: Crb = { id: 1, name: 'Nouvelle Aquitaine' }

const nouvelleAquitaine: Instruction = {
    id: 1,
    crb: crbNouvelleAquitaine.id,
    subvention: demandeBciat.id,
    name: 'Instruction 1',
    avisCrbRequis: true,
    dateSaisineCrb: new Date('2026-03-15'),
    dateAvisCrb: new Date('2026-08-05'),
    avisCRB: 'Avis favorable',
    dateAvisPrefet: null,
    avisPrefet: 'En attente',
    phase: 'Avis préfet en attente',
}

const openPlan = async () =>
    fireEvent.click(await screen.findByRole('button', { name: 'Voir le plan' }))

afterEach(() => {
    cleanup()
})

describe('App', () => {
    it('renders the screen once the plans have loaded', async () => {
        render(<App {...fakePorts()} />)

        expect(
            await screen.findByRole('heading', {
                level: 1,
                name: 'Suivi des plans d’approvisionnement',
            })
        ).toBeDefined()
    })

    it('says so when the page is not running inside Grist', async () => {
        render(
            <App
                {...fakePorts({
                    plans: planPort(() =>
                        Promise.reject(
                            new DataSourceUnavailableError('no grist')
                        )
                    ),
                })}
            />
        )

        expect(
            await screen.findByText(/n’est pas ouverte dans Grist/)
        ).toBeDefined()
    })

    it('says so when the document refuses to be read', async () => {
        render(
            <App
                {...fakePorts({
                    plans: planPort(() =>
                        Promise.reject(new AccessDeniedError('read only'))
                    ),
                })}
            />
        )

        expect(
            await screen.findByText(/besoin d’un accès complet au document/)
        ).toBeDefined()
    })

    it('shows the message of any other failure', async () => {
        render(
            <App
                {...fakePorts({
                    plans: planPort(() =>
                        Promise.reject(new Error('Table not found'))
                    ),
                })}
            />
        )

        expect(await screen.findByText(/Table not found/)).toBeDefined()
    })

    it('opens the plan whose button was clicked', async () => {
        render(<App {...fakePorts({ plans: planPort(rows([saintJunien])) })} />)

        await openPlan()

        expect(
            screen.getByRole('heading', { level: 1, name: 'RC Saint Junien' })
        ).toBeDefined()
        expect(
            screen.getByRole('navigation', { name: 'Sections du plan' })
        ).toBeDefined()
    })

    it('puts the list back when the plan is closed', async () => {
        render(<App {...fakePorts({ plans: planPort(rows([saintJunien])) })} />)

        await openPlan()
        fireEvent.click(screen.getByRole('button', { name: 'Accueil' }))

        expect(
            screen.getByRole('heading', {
                level: 1,
                name: 'Suivi des plans d’approvisionnement',
            })
        ).toBeDefined()
    })

    it('opens the plan on the chronologies of its instructions', async () => {
        render(
            <App
                {...fakePorts({
                    plans: planPort(rows([saintJunien])),
                    demandesSubvention: { list: rows([demandeBciat]) },
                    programmesAide: programmeAidePort(rows([bciat])),
                    instructions: instructionPort(rows([nouvelleAquitaine])),
                    crbs: { list: rows([crbNouvelleAquitaine]) },
                })}
            />
        )

        await openPlan()

        expect(
            screen.getByRole('heading', {
                name: 'Chronologie de l’instruction - BCIAT',
            })
        ).toBeDefined()
        expect(
            screen.getByRole('heading', { name: 'Nouvelle Aquitaine' })
        ).toBeDefined()
        expect(screen.getByText('5 août 2026')).toBeDefined()
        expect(screen.getByText('Avis favorable')).toBeDefined()
    })

    it('names the appel à projet and the région under the plan’s title', async () => {
        render(
            <App
                {...fakePorts({
                    plans: planPort(rows([saintJunien])),
                    demandesSubvention: { list: rows([demandeBciat]) },
                    programmesAide: programmeAidePort(rows([bciat])),
                    insee: {
                        listDepartementsByRegion: rows([
                            nouvelleAquitaineInsee,
                        ]),
                    },
                })}
            />
        )

        await openPlan()

        // The « : » after each term is drawn by the stylesheet, so the text
        // here is the term on its own.
        expect(screen.getByText('Appel à projet')).toBeDefined()
        expect(screen.getByText('BCIAT (2023)')).toBeDefined()
        expect(screen.getByText("Région de l'installation")).toBeDefined()
        expect(screen.getByText('Nouvelle-Aquitaine')).toBeDefined()
    })

    it('says as much when neither can be answered', async () => {
        // No demande de subvention names an appel, and no référentiel names
        // the région of the plan's département. Both lines stay, so the header
        // keeps its shape.
        render(<App {...fakePorts({ plans: planPort(rows([saintJunien])) })} />)

        await openPlan()

        expect(screen.getAllByText('—')).toHaveLength(2)
    })

    it('leaves the fil d’instruction empty for a plan with no demande', async () => {
        render(
            <App
                {...fakePorts({
                    plans: planPort(rows([saintJunien])),
                    programmesAide: programmeAidePort(rows([bciat])),
                    instructions: instructionPort(rows([nouvelleAquitaine])),
                })}
            />
        )

        await openPlan()

        expect(
            screen.getByText(
                'Aucune demande de subvention n’est rattachée à ce plan.'
            )
        ).toBeDefined()
    })

    it('shows the plan’s ressources under the Ressources section', async () => {
        render(
            <App
                {...fakePorts({
                    plans: planPort(rows([saintJunien])),
                    approvisionnements: {
                        list: rows([]),
                        listGroupedByPlanAndRessource: rows([
                            {
                                planDApprovisionnement: saintJunien.id,
                                ressource: 'PF',
                                tonnageTotal: 120,
                                repartition: 1,
                            },
                        ]),
                        listGroupedByPlanRessourceAndRegion: rows([]),
                        listGroupedByPlanRessourceAndDepartement: rows([]),
                        listGroupedByPlanRessourceAndFournisseur: rows([]),
                    },
                    ressources: {
                        list: rows([
                            { code: 'PF', title: 'Plaquettes forestières' },
                        ]),
                    },
                })}
            />
        )

        await openPlan()
        fireEvent.click(screen.getByRole('button', { name: 'Ressources' }))

        expect(await screen.findByText('Plaquettes forestières')).toBeDefined()
        expect(screen.queryByRole('combobox')).toBeNull()
    })
})
