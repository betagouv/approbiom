import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
    AccessDeniedError,
    DataSourceUnavailableError,
} from '@shared/core/errors'
import type { InstructionPort } from '@shared/core/application/ports/instruction'
import type { PlanPort } from '@shared/core/application/ports/plan-d-approvisionnement'
import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'
import type { Crb } from '@shared/core/domain/entities/crb'
import type { DemandeSubvention } from '@shared/core/domain/entities/demande-subvention'
import type { Installation } from '@shared/core/domain/entities/installation'
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
        programmesAide: { list: rows([]) },
        instructions: instructionPort(),
        crbs: { list: rows([]) },
        installations: { list: rows([]) },
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

// The chain the header's « Région » follows: the plan points here, and this is
// what carries the commune the département — and so the région — is read from.
const chaufferieDeSaintJunien: Installation = {
    id: saintJunien.installation,
    nom: 'Chaufferie de Saint-Junien',
    commune: { com: '87154', libelle: 'Saint-Junien', dep: '87' },
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

const openDossier = async () =>
    fireEvent.click(
        await screen.findByRole('button', { name: 'Voir le dossier' })
    )

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

    it('opens the dossier of the plan whose button was clicked', async () => {
        render(<App {...fakePorts({ plans: planPort(rows([saintJunien])) })} />)

        await openDossier()

        expect(
            screen.getByRole('heading', { level: 1, name: 'RC Saint Junien' })
        ).toBeDefined()
        expect(
            screen.getByRole('navigation', { name: 'Sections du dossier' })
        ).toBeDefined()
    })

    it('puts the list back when the dossier is closed', async () => {
        render(<App {...fakePorts({ plans: planPort(rows([saintJunien])) })} />)

        await openDossier()
        fireEvent.click(screen.getByRole('button', { name: 'Accueil' }))

        expect(
            screen.getByRole('heading', {
                level: 1,
                name: 'Suivi des plans d’approvisionnement',
            })
        ).toBeDefined()
    })

    it('opens the dossier on the chronologies of its instructions', async () => {
        render(
            <App
                {...fakePorts({
                    plans: planPort(rows([saintJunien])),
                    demandesSubvention: { list: rows([demandeBciat]) },
                    programmesAide: { list: rows([bciat]) },
                    instructions: instructionPort(rows([nouvelleAquitaine])),
                    crbs: { list: rows([crbNouvelleAquitaine]) },
                })}
            />
        )

        await openDossier()

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
                    programmesAide: { list: rows([bciat]) },
                    installations: { list: rows([chaufferieDeSaintJunien]) },
                    insee: {
                        listDepartementsByRegion: rows([
                            nouvelleAquitaineInsee,
                        ]),
                    },
                })}
            />
        )

        await openDossier()

        // The « : » after each term is drawn by the stylesheet, so the text
        // here is the term on its own.
        expect(screen.getByText('Appel à projet')).toBeDefined()
        expect(screen.getByText('BCIAT (2023)')).toBeDefined()
        expect(screen.getByText("Région de l'installation")).toBeDefined()
        expect(screen.getByText('Nouvelle-Aquitaine')).toBeDefined()
    })

    it('says as much when neither can be answered', async () => {
        // No demande de subvention names an appel, and no installation places
        // the plan. Both lines stay, so the header keeps its shape.
        render(<App {...fakePorts({ plans: planPort(rows([saintJunien])) })} />)

        await openDossier()

        expect(screen.getAllByText('—')).toHaveLength(2)
    })

    it('leaves the fil d’instruction empty for a dossier with no demande', async () => {
        render(
            <App
                {...fakePorts({
                    plans: planPort(rows([saintJunien])),
                    programmesAide: { list: rows([bciat]) },
                    instructions: instructionPort(rows([nouvelleAquitaine])),
                })}
            />
        )

        await openDossier()

        expect(
            screen.getByText(
                'Aucune demande de subvention n’est rattachée à ce dossier.'
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

        await openDossier()
        fireEvent.click(screen.getByRole('button', { name: 'Ressources' }))

        expect(await screen.findByText('Plaquettes forestières')).toBeDefined()
        expect(screen.queryByRole('combobox')).toBeNull()
    })
})
