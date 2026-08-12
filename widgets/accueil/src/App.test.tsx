import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
    AccessDeniedError,
    DataSourceUnavailableError,
} from '@shared/application/errors'
import type { PlanQuery } from '@shared/application/ports/plan-query'
import type { Plan } from '@shared/application/read-models/plan'
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
