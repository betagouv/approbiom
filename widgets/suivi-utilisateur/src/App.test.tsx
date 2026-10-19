import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'
import App from './App'
import type { OptionsPort, SuiviUtilisateurOptions } from './options'

let nextPlan = 1

/** A plan created by `createdBy` at `createdAt` — both null when untracked. */
const creation = (
    createdBy: string | null,
    createdAt: string | null
): Plan => ({
    id: nextPlan++,
    nom: 'RCU Val Fleuri',
    installation: 1,
    typeDePlan: 'création',
    usage: 'énergie',
    natureDonnee: 'prévision',
    statut: 'projet',
    createdBy,
    createdAt: createdAt === null ? null : new Date(createdAt),
})

const CREATIONS: Plan[] = [
    creation(null, null),
    creation('claire.godel', '2026-10-16T13:39:26Z'),
    creation('claire.godel', '2026-10-16T13:53:58Z'),
    creation('valentine.langer.ext', '2026-10-19T08:58:19Z'),
]

/**
 * Options kept in memory as Grist keeps them: what the widget sets is a draft,
 * which the user then saves or reverts from the section's header. Comes with
 * the buttons Grist shows around the widget.
 */
function fakeOptions(nombreUtilisateurs: number | null) {
    const saved = nombreUtilisateurs
    let draft = nombreUtilisateurs
    const editListeners = new Set<() => void>()
    const changeListeners = new Set<() => void>()

    const subscribe =
        (listeners: Set<() => void>) => (listener: () => void) => {
            listeners.add(listener)
            return () => {
                listeners.delete(listener)
            }
        }
    const notify = (listeners: Set<() => void>) => () => {
        for (const listener of listeners) listener()
    }

    const port = {
        read: () => Promise.resolve({ nombreUtilisateurs: draft }),
        save: vi.fn(({ nombreUtilisateurs }: SuiviUtilisateurOptions) => {
            draft = nombreUtilisateurs
            notify(changeListeners)()
            return Promise.resolve()
        }),
        onEdit: subscribe(editListeners),
        onChange: subscribe(changeListeners),
    } satisfies OptionsPort

    return {
        port,
        // « Ouvrir la configuration », in the creator panel.
        openConfiguration: notify(editListeners),
        // The revert button Grist shows next to « Enregistrer ».
        revert: () => {
            draft = saved
            notify(changeListeners)()
        },
    }
}

function renderApp({
    creations = CREATIONS,
    nombreUtilisateurs = 10,
}: {
    creations?: readonly Plan[]
    nombreUtilisateurs?: number | null
} = {}) {
    const options = fakeOptions(nombreUtilisateurs)

    render(
        <App
            plans={{ list: () => Promise.resolve(creations) }}
            options={options.port}
        />
    )

    return options
}

const indicateur = async (titre: string) =>
    (await screen.findByRole('heading', { name: titre })).closest<HTMLElement>(
        '.fr-tile'
    )!

afterEach(() => {
    cleanup()
})

describe('App', () => {
    it('counts the plans created since the tracking began', async () => {
        renderApp()

        const tile = await indicateur('Plans créés')

        expect(within(tile).getByText('3')).toBeDefined()
        expect(
            within(tile).getByText('Depuis le 16 octobre 2026')
        ).toBeDefined()
    })

    it('gives the share of users who created a plan', async () => {
        renderApp({ nombreUtilisateurs: 8 })

        const tile = await indicateur('Utilisateurs ayant créé un plan')

        // Intl separates the figure from « % » with a narrow no-break space.
        expect(tile.textContent).toMatch(/25\s%/)
        expect(tile.textContent).toContain('2 utilisateurs sur 8')
        expect(tile.textContent).toContain(
            'Le nombre total d’utilisateurs est saisi à la main, dans la configuration du widget.'
        )
    })

    it('draws the share of users as a bar', async () => {
        renderApp({ nombreUtilisateurs: 8 })

        const tile = await indicateur('Utilisateurs ayant créé un plan')
        const barre = tile.querySelector<HTMLElement>(
            '.indicateur__barre-valeur'
        )

        expect(barre?.style.width).toBe('25%')
        // The figure says it in words already.
        expect(barre?.closest('[aria-hidden="true"]')).not.toBeNull()
    })

    // A total set too low gives more than 100 %: the bar stops at full.
    it('fills the bar no further than full', async () => {
        renderApp({ nombreUtilisateurs: 1 })

        const tile = await indicateur('Utilisateurs ayant créé un plan')

        expect(tile.textContent).toMatch(/200\s%/)
        expect(
            tile.querySelector<HTMLElement>('.indicateur__barre-valeur')?.style
                .width
        ).toBe('100%')
    })

    it('asks for the number of users until it is configured', async () => {
        renderApp({ nombreUtilisateurs: null })

        const tile = await indicateur('Utilisateurs ayant créé un plan')

        expect(tile.textContent).toContain('Non configuré')
        expect(tile.textContent).toContain(
            'Renseignez le nombre total d’utilisateurs dans la configuration du widget.'
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
            ['19/10/2026', 'valentine.langer.ext', '1'],
            ['12/10/2026', 'claire.godel', '2'],
        ])
    })

    it('says so when no plan has been created since the tracking began', async () => {
        renderApp({ creations: [creation(null, null)] })

        expect(await screen.findByText(/aucun plan n’a été créé/)).toBeDefined()
        expect(screen.queryByRole('table')).toBeNull()
    })

    describe('configuration', () => {
        async function openConfiguration(nombreUtilisateurs: number | null) {
            const options = renderApp({ nombreUtilisateurs })
            await indicateur('Plans créés')

            options.openConfiguration()

            const input = await screen.findByLabelText(
                /Nombre total d’utilisateurs/
            )
            return { ...options, input }
        }

        it('opens when Grist asks to configure the widget', async () => {
            const { input } = await openConfiguration(10)

            expect((input as HTMLInputElement).value).toBe('10')
            expect(document.activeElement).toBe(input)
            expect(screen.queryByRole('table')).toBeNull()
        })

        // A messages block that only appears along with its message appears
        // too late to be announced, so it is there, empty, from the start.
        it('keeps the live region on the page while there is nothing to say', async () => {
            const { input } = await openConfiguration(10)

            const messages = document.getElementById(
                input.getAttribute('aria-describedby') ?? ''
            )
            expect(messages?.getAttribute('aria-live')).toBe('polite')
            expect(input.getAttribute('aria-invalid')).toBeNull()
        })

        it('applies the number of users and shows the share it gives', async () => {
            const { port, input } = await openConfiguration(null)

            fireEvent.change(input, { target: { value: '4' } })
            fireEvent.click(screen.getByRole('button', { name: 'Appliquer' }))

            const tile = await indicateur('Utilisateurs ayant créé un plan')
            expect(port.save).toHaveBeenCalledWith({ nombreUtilisateurs: 4 })
            await vi.waitFor(() => {
                expect(tile.textContent).toMatch(/50\s%/)
            })
        })

        // Grist keeps the number applied as a draft: reverted from the
        // section's header, the share goes back to the number saved before.
        it('follows the number of users reverted from Grist', async () => {
            const { input, revert } = await openConfiguration(10)

            fireEvent.change(input, { target: { value: '4' } })
            fireEvent.click(screen.getByRole('button', { name: 'Appliquer' }))
            const tile = await indicateur('Utilisateurs ayant créé un plan')
            await vi.waitFor(() => {
                expect(tile.textContent).toMatch(/50\s%/)
            })

            revert()

            await vi.waitFor(() => {
                expect(tile.textContent).toMatch(/20\s%/)
            })
        })

        it.each(['', '0', '-2', '2.5'])(
            'refuses « %s » as a number of users',
            async (value) => {
                const { port, input } = await openConfiguration(10)

                fireEvent.change(input, { target: { value } })
                fireEvent.click(
                    screen.getByRole('button', { name: 'Appliquer' })
                )

                const message = await screen.findByText(
                    'Saisissez un nombre entier supérieur à 0.'
                )
                expect(
                    message.closest(
                        `#${input.getAttribute('aria-describedby')}`
                    )
                ).not.toBeNull()
                expect(input.getAttribute('aria-invalid')).toBe('true')
                expect(port.save).not.toHaveBeenCalled()
            }
        )

        it('says so when the number of users could not be applied', async () => {
            const { port, input } = await openConfiguration(10)
            port.save.mockRejectedValueOnce(new Error('accès refusé'))

            fireEvent.change(input, { target: { value: '12' } })
            fireEvent.click(screen.getByRole('button', { name: 'Appliquer' }))

            expect((await screen.findByRole('alert')).textContent).toBe(
                'La configuration n’a pas pu être appliquée : accès refusé'
            )
            // The number itself was fine: the field is not put in error.
            expect(input.getAttribute('aria-invalid')).toBeNull()
        })

        it('closes without applying anything on « Annuler »', async () => {
            const { port } = await openConfiguration(10)

            fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))

            expect(
                await screen.findByRole('table', {
                    name: /Plans créés par utilisateur et par semaine/,
                })
            ).toBeDefined()
            expect(port.save).not.toHaveBeenCalled()
        })

        // The button that closed the form is gone with it: the focus lands on
        // the page's title rather than falling back to the top of the page.
        it('hands the focus to the title once closed', async () => {
            await openConfiguration(10)

            fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))

            expect(document.activeElement).toBe(
                screen.getByRole('heading', {
                    level: 1,
                    name: 'Suivi des interactions utilisateur',
                })
            )
        })
    })
})
