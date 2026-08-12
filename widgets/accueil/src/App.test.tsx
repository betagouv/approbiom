import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
    AccessDeniedError,
    DataSourceUnavailableError,
} from '@shared/application/errors'
import type { PlanQuery } from '@shared/application/ports/plan-query'
import type { Plan } from '@shared/application/read-models/plan'
import type { DemandeSubvention } from '@shared/application/domain/demande-subvention'
import type { Instruction } from '@shared/application/domain/instruction'
import type { ProgrammeAide } from '@shared/application/domain/programme-aide'
import App from './App'
import type { AccueilPorts } from './load-accueil'

const rows =
    <T,>(value: readonly T[]) =>
    () =>
        Promise.resolve(value)

const planQuery = (list: PlanQuery['list']): PlanQuery => ({ list })

function fakePorts(overrides: Partial<AccueilPorts> = {}): AccueilPorts {
    return {
        plans: { list: rows([]) },
        approvisionnements: {
            listApprovisionnements: rows([]),
            listByPlanAndRessource: rows([]),
            listByPlanRessourceAndRegion: rows([]),
            listByPlanRessourceAndFournisseur: rows([]),
            listByPlanRessourceAndDepartementDeProvenance: rows([]),
        },
        ressources: { list: rows([]) },
        entreprises: { list: rows([]) },
        insee: { listDepartementsByRegion: rows([]) },
        demandesSubvention: { list: rows([]) },
        programmesAide: { list: rows([]) },
        instructions: { list: rows([]) },
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
}

const demandeBciat: DemandeSubvention = {
    id: 1,
    programmeAide: bciat.id,
    planDApprovisionnement: saintJunien.id,
}

const nouvelleAquitaine: Instruction = {
    crb: 'Nouvelle Aquitaine',
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
                    plans: planQuery(() =>
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
                    plans: planQuery(() =>
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
                    plans: planQuery(() =>
                        Promise.reject(new Error('Table not found'))
                    ),
                })}
            />
        )

        expect(await screen.findByText(/Table not found/)).toBeDefined()
    })

    it('opens the dossier of the plan whose button was clicked', async () => {
        render(
            <App {...fakePorts({ plans: planQuery(rows([saintJunien])) })} />
        )

        await openDossier()

        expect(
            screen.getByRole('heading', { level: 1, name: 'RC Saint Junien' })
        ).toBeDefined()
        expect(
            screen.getByRole('navigation', { name: 'Sections du dossier' })
        ).toBeDefined()
    })

    it('puts the list back when the dossier is closed', async () => {
        render(
            <App {...fakePorts({ plans: planQuery(rows([saintJunien])) })} />
        )

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
                    plans: planQuery(rows([saintJunien])),
                    demandesSubvention: { list: rows([demandeBciat]) },
                    programmesAide: { list: rows([bciat]) },
                    instructions: { list: rows([nouvelleAquitaine]) },
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

    it('leaves the fil d’instruction empty for a dossier with no demande', async () => {
        render(
            <App
                {...fakePorts({
                    plans: planQuery(rows([saintJunien])),
                    programmesAide: { list: rows([bciat]) },
                    instructions: { list: rows([nouvelleAquitaine]) },
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
                    plans: planQuery(rows([saintJunien])),
                    approvisionnements: {
                        listApprovisionnements: rows([]),
                        listByPlanAndRessource: rows([
                            {
                                planDApprovisionnement: saintJunien.id,
                                ressource: 'PF',
                                sumTonnageTotal: 120,
                            },
                        ]),
                        listByPlanRessourceAndRegion: rows([]),
                        listByPlanRessourceAndFournisseur: rows([]),
                        listByPlanRessourceAndDepartementDeProvenance: rows([]),
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
