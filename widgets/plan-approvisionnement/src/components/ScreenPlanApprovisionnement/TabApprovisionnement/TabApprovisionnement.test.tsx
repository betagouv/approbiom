import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import { DEPARTEMENT_FRANCAIS } from '@shared/core/domain/value-objects/provenance'
import TabApprovisionnement, {
    type TabApprovisionnementProps,
} from './TabApprovisionnement'

const REFERENTIELS = {
    entreprises: [
        { siret: '00000000000001', denomination: 'BOIS FICTIF ENERGIE' },
    ],
    ressources: [
        {
            code: '1A-PFA',
            ademeCode: '2017-1A-PFA',
            title: 'Plaquettes forestières',
            description: 'Plaquettes forestières dont souches et rémanents',
        },
    ],
    departementsByRegion: [
        {
            region: { reg: '75', libelle: 'Nouvelle-Aquitaine' },
            departements: [
                { dep: '19', libelle: 'Corrèze' },
                { dep: '87', libelle: 'Haute-Vienne' },
            ],
        },
    ],
}

function approvisionnement(
    id: number,
    dep: string,
    fournisseur: string | null = '00000000000001'
): Approvisionnement {
    return {
        id,
        planDApprovisionnement: 1,
        fournisseur: fournisseur ?? undefined,
        ressource: '1A-PFA',
        provenance: { source: DEPARTEMENT_FRANCAIS, code: dep },
        tonnageTotal: 1200.5,
    }
}

function renderTab(
    approvisionnements: readonly Approvisionnement[],
    hasAttachments = true,
    {
        onUpdate = vi.fn(() => Promise.resolve()),
        onDelete = vi.fn(() => Promise.resolve()),
        onCreatePays = vi.fn(() => Promise.resolve()),
    }: {
        onUpdate?: TabApprovisionnementProps['onUpdate']
        onDelete?: TabApprovisionnementProps['onDelete']
        onCreatePays?: TabApprovisionnementProps['onCreatePays']
    } = {}
) {
    render(
        <TabApprovisionnement
            approvisionnements={approvisionnements}
            pays={[{ libelle: 'Espagne' }]}
            hasAttachments={hasAttachments}
            onCreate={() => Promise.resolve()}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onCreateEntreprise={() => Promise.resolve()}
            findEntrepriseBySiret={() =>
                Promise.resolve({ status: 'notfound' })
            }
            onCreatePays={onCreatePays}
            onImportFromDocument={() => {}}
            {...REFERENTIELS}
        />
    )
}

const dialog = () => screen.getByRole('dialog')

const bodyRows = () => screen.getAllByRole('row').slice(1)

afterEach(cleanup)

describe('TabApprovisionnement', () => {
    it('shows each approvisionnement in a named table', () => {
        renderTab([approvisionnement(1, '19')])

        expect(
            screen.getByRole('table', { name: 'Approvisionnements du plan' })
        ).toBeTruthy()
        // Intl separates thousands with a narrow no-break space.
        expect(
            within(bodyRows()[0])
                .getAllByRole('cell')
                .map((cell) => cell.textContent.replace(/\s/g, ' '))
        ).toEqual([
            'Pas de doublon',
            'BOIS FICTIF ENERGIE',
            '1A-PFA · Plaquettes forestières',
            'Corrèze (19)',
            '1 200,5',
            "Modifier l'approvisionnement BOIS FICTIF ENERGIE, 1A-PFA · Plaquettes forestières, Corrèze (19)Supprimer l'approvisionnement BOIS FICTIF ENERGIE, 1A-PFA · Plaquettes forestières, Corrèze (19)",
        ])
    })

    it('says when the plan does not give the fournisseur', () => {
        renderTab([approvisionnement(1, '19', null)])

        expect(screen.getByText('Non renseigné')).toBeTruthy()
    })

    it('says nothing of duplicates when there are none', () => {
        renderTab([approvisionnement(1, '19'), approvisionnement(2, '87')])

        expect(screen.queryByText(/à corriger/)).toBeNull()
    })

    it('counts the groups of duplicates', () => {
        renderTab([
            approvisionnement(1, '19'),
            approvisionnement(2, '19'),
            approvisionnement(3, '87', null),
            approvisionnement(4, '87', null),
        ])

        expect(screen.getByText('2 doublons à corriger')).toBeTruthy()
        expect(screen.getAllByText('Doublon A')).toHaveLength(2)
        expect(screen.getAllByText('Doublon B')).toHaveLength(2)
    })

    it('shows only the duplicates, then every row again', () => {
        renderTab([
            approvisionnement(1, '19'),
            approvisionnement(2, '19'),
            approvisionnement(3, '87'),
        ])

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Afficher uniquement les doublons',
            })
        )
        expect(bodyRows()).toHaveLength(2)

        fireEvent.click(
            screen.getByRole('button', { name: 'Afficher toutes les lignes' })
        )
        expect(bodyRows()).toHaveLength(3)
    })

    it('offers the document when the plan has an attachment', () => {
        renderTab([])

        expect(
            screen.getByText('Aucun approvisionnement pour ce plan')
        ).toBeTruthy()
        expect(
            screen.getByText(/document BCIB\/BCIAT joint au plan/)
        ).toBeTruthy()
    })

    it('says why the document cannot be used without an attachment', () => {
        renderTab([], false)

        expect(
            screen.getByText(/Aucune pièce jointe n'est liée à ce plan/)
        ).toBeTruthy()
    })

    describe('modifier', () => {
        it('opens on the approvisionnement as it is', () => {
            renderTab([approvisionnement(1, '19')])

            fireEvent.click(screen.getByRole('button', { name: /^Modifier/ }))

            expect(
                within(dialog()).getByRole<HTMLInputElement>('combobox', {
                    name: /Fournisseur/,
                }).value
            ).toBe('BOIS FICTIF ENERGIE — 00000000000001')
            expect(
                within(dialog()).getByRole<HTMLInputElement>('textbox', {
                    name: /Tonnage/,
                }).value
            ).toBe('1200,5')
        })

        it('saves the fields and closes', async () => {
            const onUpdate = vi.fn(() => Promise.resolve())
            renderTab([approvisionnement(1, '19')], true, { onUpdate })

            fireEvent.click(screen.getByRole('button', { name: /^Modifier/ }))
            fireEvent.change(
                within(dialog()).getByRole('textbox', { name: /Tonnage/ }),
                { target: { value: '900' } }
            )
            fireEvent.click(
                within(dialog()).getByRole('button', { name: 'Enregistrer' })
            )

            await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
            expect(onUpdate).toHaveBeenCalledWith(1, {
                fournisseur: '00000000000001',
                ressource: '1A-PFA',
                provenance: { source: DEPARTEMENT_FRANCAIS, code: '19' },
                tonnageTotal: 900,
            })
        })

        it('stays open and says so when the save fails', async () => {
            renderTab([approvisionnement(1, '19')], true, {
                onUpdate: () => Promise.reject(new Error('Grist')),
            })

            fireEvent.click(screen.getByRole('button', { name: /^Modifier/ }))
            fireEvent.click(
                within(dialog()).getByRole('button', { name: 'Enregistrer' })
            )

            expect(
                (await within(dialog()).findByRole('alert')).textContent
            ).toMatch(/L'enregistrement a échoué/)
        })

        it('cannot save a tonnage that is not above zero', () => {
            renderTab([approvisionnement(1, '19')])

            fireEvent.click(screen.getByRole('button', { name: /^Modifier/ }))
            fireEvent.change(
                within(dialog()).getByRole('textbox', { name: /Tonnage/ }),
                { target: { value: '0' } }
            )

            expect(
                within(dialog()).getByRole<HTMLButtonElement>('button', {
                    name: 'Enregistrer',
                }).disabled
            ).toBe(true)
            expect(
                within(dialog()).getByText(
                    'Saisissez un tonnage supérieur à 0.'
                )
            ).toBeTruthy()
        })
    })

    describe('supprimer', () => {
        it('recalls the approvisionnement before deleting it', async () => {
            const onDelete = vi.fn(() => Promise.resolve())
            renderTab([approvisionnement(1, '19')], true, { onDelete })

            fireEvent.click(screen.getByRole('button', { name: /^Supprimer/ }))
            expect(
                within(dialog()).getByText(
                    /^Corrèze \(19\) · 1\s200,5\st MV\/an$/
                )
            ).toBeTruthy()
            fireEvent.click(
                within(dialog()).getByRole('button', { name: 'Supprimer' })
            )

            await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
            expect(onDelete).toHaveBeenCalledWith(1)
        })

        it('stays open and says so when the deletion fails', async () => {
            renderTab([approvisionnement(1, '19')], true, {
                onDelete: () => Promise.reject(new Error('Grist')),
            })

            fireEvent.click(screen.getByRole('button', { name: /^Supprimer/ }))
            fireEvent.click(
                within(dialog()).getByRole('button', { name: 'Supprimer' })
            )

            expect(
                (await within(dialog()).findByRole('alert')).textContent
            ).toMatch(/La suppression a échoué/)
        })
    })

    describe('ajouter', () => {
        const openChoice = () =>
            fireEvent.click(
                screen.getByRole('button', {
                    name: 'Ajouter des approvisionnements',
                })
            )

        it('can be reached from an empty plan', () => {
            renderTab([])

            openChoice()

            expect(
                screen.getByRole('radio', { name: /Saisie manuelle/ })
            ).toBeTruthy()
        })

        it('says why the document cannot be used without an attachment', () => {
            renderTab([], false)

            openChoice()

            const document = screen.getByRole<HTMLInputElement>('radio', {
                name: /document BCIB\/BCIAT/,
            })
            expect(document.disabled).toBe(true)
            expect(
                screen.getByText("Aucune pièce jointe n'est liée à ce plan.")
            ).toBeTruthy()
        })

        it('waits for a choice before going on', () => {
            renderTab([])

            openChoice()

            expect(
                screen.getByRole<HTMLButtonElement>('button', {
                    name: 'Continuer',
                }).disabled
            ).toBe(true)
        })

        it('creates a missing pays and chooses it', async () => {
            const onCreatePays = vi.fn(() => Promise.resolve())
            renderTab([], true, { onCreatePays })

            openChoice()
            fireEvent.click(
                screen.getByRole('radio', { name: /Saisie manuelle/ })
            )
            fireEvent.click(screen.getByRole('button', { name: 'Continuer' }))
            fireEvent.click(
                within(dialog()).getByRole('button', {
                    name: /Créer un pays/,
                })
            )
            fireEvent.change(
                within(dialog()).getByRole('textbox', { name: 'Nouveau pays' }),
                { target: { value: 'Portugal' } }
            )
            fireEvent.click(
                within(dialog()).getByRole('button', { name: 'Créer le pays' })
            )

            expect(
                await within(dialog()).findByText('Pays créé et sélectionné.')
            ).toBeTruthy()
            expect(onCreatePays).toHaveBeenCalledWith({ libelle: 'Portugal' })
        })
    })
})
