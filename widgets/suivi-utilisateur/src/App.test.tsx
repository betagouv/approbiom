import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'
import type { Utilisateur } from '@shared/core/domain/entities/utilisateur'
import App from './App'

let nextId = 1

/** A plan created by `createdBy` at `createdAt` — both null when untracked. */
const creation = (
    createdBy: string | null,
    createdAt: string | null
): Plan => ({
    id: nextId++,
    nom: 'RCU Val Fleuri',
    installation: 1,
    typeDePlan: 'création',
    usage: 'énergie',
    natureDonnee: 'prévision',
    statut: 'projet',
    createdBy,
    createdAt: createdAt === null ? null : new Date(createdAt),
})

const compte = (email: string, utilisateurApprobiom = true): Utilisateur => ({
    id: nextId++,
    email,
    utilisateurApprobiom,
})

const CREATIONS: Plan[] = [
    creation(null, null),
    creation('camille.martin@example.fr', '2026-10-16T13:39:26Z'),
    creation('camille.martin@example.fr', '2026-10-16T13:53:58Z'),
    creation('alex.durand@example.fr', '2026-10-19T08:58:19Z'),
    // An administrator's: not ticked « Utilisateur Approbiom ».
    creation('admin@example.fr', '2026-10-14T09:00:00Z'),
]

const COMPTES: Utilisateur[] = [
    compte('camille.martin@example.fr'),
    compte('alex.durand@example.fr'),
    compte('sam.petit@example.fr'),
    compte('jean.dupont@example.fr'),
    compte('admin@example.fr', false),
]

function renderApp({
    creations = CREATIONS,
    comptes = COMPTES,
}: {
    creations?: readonly Plan[]
    comptes?: readonly Utilisateur[]
} = {}) {
    render(
        <App
            plans={{ list: () => Promise.resolve(creations) }}
            utilisateurs={{ list: () => Promise.resolve(comptes) }}
        />
    )
}

const indicateur = async (titre: string) =>
    (await screen.findByRole('heading', { name: titre })).closest<HTMLElement>(
        '.fr-tile'
    )!

afterEach(() => {
    cleanup()
})

describe('App', () => {
    it('counts the plans the users created since the tracking began', async () => {
        renderApp()

        const tile = await indicateur('Plans créés')

        // The administrator's plan, the first one made, is left out.
        expect(within(tile).getByText('3')).toBeDefined()
        expect(
            within(tile).getByText('Depuis le 16 octobre 2026')
        ).toBeDefined()
    })

    it('gives the share of users who created a plan', async () => {
        renderApp()

        const tile = await indicateur('Utilisateurs ayant créé un plan')

        // Intl separates the figure from « % » with a narrow no-break space.
        expect(tile.textContent).toMatch(/50\s%/)
        expect(tile.textContent).toContain('2 utilisateurs sur 4')
        expect(tile.textContent).toContain(
            'Les utilisateurs sont les comptes cochés « Utilisateur Approbiom » dans la table Utilisateur : les plans des autres comptes ne sont pas comptés.'
        )
    })

    it('draws the share of users as a bar', async () => {
        renderApp()

        const tile = await indicateur('Utilisateurs ayant créé un plan')
        const barre = tile.querySelector<HTMLElement>(
            '.indicateur__barre-valeur'
        )

        expect(barre?.style.width).toBe('50%')
        // The figure says it in words already.
        expect(barre?.closest('[aria-hidden="true"]')).not.toBeNull()
    })

    it('says so when no account is ticked « Utilisateur Approbiom »', async () => {
        renderApp({ comptes: [compte('admin@example.fr', false)] })

        const tile = await indicateur('Utilisateurs ayant créé un plan')

        expect(tile.textContent).toContain('Aucun utilisateur')
        expect(tile.textContent).toContain(
            'Aucun compte n’est coché « Utilisateur Approbiom » dans la table Utilisateur.'
        )
        expect(tile.querySelector('.indicateur__barre')).toBeNull()
    })

    it('lists the plans of each user in each week, the latest week first', async () => {
        renderApp()

        const table = await screen.findByRole('table', {
            name: 'Plans créés par utilisateur et par semaine',
        })
        const [header, ...rows] = within(table).getAllByRole('row')

        expect(
            within(header)
                .getAllByRole('columnheader')
                .map((cell) => cell.textContent)
        ).toEqual(['Semaine duTrier', 'UtilisateurTrier', 'Plans créésTrier'])
        expect(
            rows.map((row) =>
                within(row)
                    .getAllByRole('cell')
                    .map((cell) => cell.textContent)
            )
        ).toEqual([
            ['19/10/2026', 'alex.durand@example.fr', '1'],
            ['12/10/2026', 'camille.martin@example.fr', '2'],
        ])
    })

    it('says so when no user has created a plan since the tracking began', async () => {
        renderApp({
            creations: [
                creation(null, null),
                creation('admin@example.fr', '2026-10-14T09:00:00Z'),
            ],
        })

        expect(
            await screen.findByText(/aucun utilisateur n’a créé de plan/)
        ).toBeDefined()
        expect(screen.queryByRole('table')).toBeNull()
    })
})
