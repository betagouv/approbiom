import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
    creation('camille.martin@example.fr', '2026-10-20T09:00:00Z'),
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

const cadre = async () =>
    (
        await screen.findByRole('heading', {
            name: 'Utilisateurs ayant créé un plan cette semaine',
        })
    ).closest<HTMLElement>('section')!

const colonnes = (section: HTMLElement) =>
    [...section.querySelectorAll<HTMLElement>('.graphique__semaine')].map(
        (colonne) => ({
            lundi: colonne.querySelector('.graphique__lundi')?.textContent,
            valeur: colonne.querySelector('.graphique__valeur')?.textContent,
            part: colonne
                .querySelector<HTMLElement>('.graphique__barre')
                ?.style.getPropertyValue('--part'),
        })
    )

// Only the clock: the promises and timers the screens wait on run as usual.
beforeEach(() => {
    vi.useFakeTimers({
        toFake: ['Date'],
        now: new Date('2026-10-21T10:00:00Z'),
    })
})

afterEach(() => {
    cleanup()
    vi.useRealTimers()
})

describe('App', () => {
    it('gives the users who created a plan this week', async () => {
        renderApp()

        const section = await cadre()

        expect(
            section.querySelector('.cadre-semaine__valeur')?.textContent
        ).toBe('2')
        expect(section.textContent).toContain('Semaine du 19 octobre 2026')
        expect(
            screen.getByText(
                'Les plans créés avant le 5 octobre 2026, début du suivi, ne sont pas comptés.'
            )
        ).toBeDefined()
        expect(section.textContent).toContain(
            'Sur 4 utilisateurs (comptes cochés « Utilisateur Approbiom » dans la table Utilisateur).'
        )
    })

    it('says so when no account is ticked « Utilisateur Approbiom »', async () => {
        renderApp({ comptes: [compte('admin@example.fr', false)] })

        const section = await cadre()

        expect(
            section.querySelector('.cadre-semaine__valeur')?.textContent
        ).toBe('0')
        expect(section.textContent).toContain(
            'Aucun compte n’est coché « Utilisateur Approbiom » dans la table Utilisateur.'
        )
    })

    it('draws a bar per week, as tall as the users active in it', async () => {
        renderApp()

        const section = await cadre()

        // The administrator's plan, on 14 October, makes no user active.
        expect(colonnes(section)).toEqual([
            { lundi: '12 oct.', valeur: '1', part: '0.5' },
            { lundi: '19 oct.', valeur: '2', part: '1' },
        ])
        // The table below says it in words.
        expect(
            section
                .querySelector('.graphique__barres')
                ?.closest('[aria-hidden="true"]')
        ).not.toBeNull()
    })

    // Once the weeks no longer fit, the bars scroll: a keyboard must reach
    // them, and the focus must not land inside what screen readers skip.
    it('lets the keyboard scroll the bars, from outside the hidden part', async () => {
        renderApp()

        const region = within(await cadre()).getByRole('region', {
            name: 'Graphique : utilisateurs ayant créé un plan, par semaine',
        })

        expect(region.tabIndex).toBe(0)
        expect(region.closest('[aria-hidden="true"]')).toBeNull()
        expect(region.querySelector('.graphique__barres')).not.toBeNull()
    })

    it('gives the same figures in a table for screen readers', async () => {
        renderApp()

        const table = await screen.findByRole('table', {
            name: 'Utilisateurs ayant créé un plan, par semaine',
        })

        const [, ...rows] = within(table).getAllByRole('row')

        // Each figure is read out with its week, the row's header.
        expect(
            rows.map((row) => [
                within(row).getByRole('rowheader').textContent,
                within(row).getByRole('cell').textContent,
            ])
        ).toEqual([
            ['12 octobre 2026', '1'],
            ['19 octobre 2026', '2'],
        ])
    })

    it('says so when no user has created a plan yet', async () => {
        renderApp({
            creations: [
                creation(null, null),
                creation('admin@example.fr', '2026-10-14T09:00:00Z'),
            ],
        })

        const section = await cadre()

        expect(section.textContent).toContain(
            'Aucun utilisateur n’a encore créé de plan.'
        )
        expect(colonnes(section)).toEqual([])
        expect(
            await screen.findByText(/aucun utilisateur n’a créé de plan/)
        ).toBeDefined()
        expect(
            screen.queryByRole('table', {
                name: 'Plans créés par utilisateur et par semaine',
            })
        ).toBeNull()
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
            ['19/10/2026', 'camille.martin@example.fr', '1'],
            ['12/10/2026', 'camille.martin@example.fr', '2'],
        ])
    })
})
