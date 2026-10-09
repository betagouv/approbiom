import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import {
    NON_VERIFIEE,
    VERIFIEE,
} from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'
import { DEPARTEMENT_FRANCAIS } from '@shared/core/domain/value-objects/provenance'
import Verification, { type VerificationProps } from './Verification'
import type { ExtractedApprovisionnement } from '@shared/core/domain/entities/extracted-approvisionnement'

const RESSOURCE = {
    code: '1A-PFA',
    ademeCode: '2017-1A-PFA',
    title: 'Plaquettes forestières',
    description: '',
}

function line(
    id: number,
    controle: ExtractedApprovisionnement['controle'],
    percentages: readonly number[] = [100],
    withRessource = true
): ExtractedApprovisionnement {
    return {
        id,
        controle,
        extractedAt: new Date(),
        read: {
            document: 'plan.xlsx',
            excelRow: 16 + id,
            supplier: 'Scierie',
            resource: 'Plaquettes',
            tonnage: 1000,
            rawProvenance: '',
            additionalData: '',
        },
        derived: {
            parsedProvenance: {
                distribution: percentages.map((percentage) => ({
                    source: DEPARTEMENT_FRANCAIS,
                    provenance: '19',
                    percentage,
                })),
                confidence: 'Explicite',
                unrecognized: [],
            },
            matchedFournisseur: null,
            matchedRessource: withRessource ? RESSOURCE : null,
        },
    }
}

function renderVerification(
    lines: readonly ExtractedApprovisionnement[],
    onUpdateLine: VerificationProps['onUpdateLine'] = vi.fn(() =>
        Promise.resolve()
    ),
    onImport: VerificationProps['onImport'] = vi.fn(() => Promise.resolve())
) {
    render(
        <Verification
            attachment={{
                id: 20,
                planDApprovisionnement: 1,
                type: 'excel ademe',
                name: 'plan.xlsx',
                sizeInBytes: 2048,
            }}
            lines={lines}
            date={new Date('2026-10-02T14:30:00')}
            resumed
            entreprises={[]}
            ressources={[RESSOURCE]}
            departementsByRegion={[
                {
                    region: { reg: '75', libelle: 'Nouvelle-Aquitaine' },
                    departements: [{ dep: '19', libelle: 'Corrèze' }],
                },
            ]}
            pays={[]}
            getAttachmentUrl={() => Promise.resolve('data:,')}
            onUpdateLine={onUpdateLine}
            onReextract={vi.fn()}
            onImport={onImport}
            onCreateEntreprise={() => Promise.resolve()}
            findEntrepriseBySiret={() =>
                Promise.resolve({ status: 'notfound' })
            }
            onCreatePays={() => Promise.resolve()}
        />
    )

    return onUpdateLine
}

const dialog = () => screen.getByRole('dialog')

afterEach(cleanup)

describe('Verification', () => {
    it('shows where each line stands, its action last', () => {
        renderVerification([line(1, NON_VERIFIEE), line(2, VERIFIEE)])

        const rows = screen.getAllByRole('row').slice(1)
        const lastCells = rows
            .filter((row) => !row.hidden)
            .map((row) => within(row).getAllByRole('cell'))
            .map((cells) => [cells[0].textContent, cells.at(-1)?.textContent])

        expect(lastCells).toEqual([
            [NON_VERIFIEE, 'Modifier la ligne 17'],
            [VERIFIEE, 'Modifier la ligne 18'],
        ])
    })

    it('shows the total tonnage of each line', () => {
        renderVerification([line(1, NON_VERIFIEE)])

        expect(
            screen.getByRole('columnheader', {
                name: 'Tonnage total (t MV/an)',
            })
        ).toBeTruthy()
        expect(screen.getByRole('cell', { name: /^1\s000$/ })).toBeTruthy()
    })

    it('counts the verified lines, and asks for the rest', () => {
        renderVerification([line(1, NON_VERIFIEE), line(2, VERIFIEE)])

        expect(screen.getByText('1 sur 2 vérifiées')).toBeTruthy()
        expect(
            screen.getByText(
                /Vérifiez toutes les lignes pour pouvoir les importer/
            )
        ).toBeTruthy()
        expect(screen.getByText(/1\/2 lignes déjà vérifiées/)).toBeTruthy()
    })

    it('says when the distribution is off 100 %', () => {
        renderVerification([line(1, NON_VERIFIEE, [60, 30])])

        expect(screen.getByText('Total 90 % ≠ 100 %')).toBeTruthy()
    })

    it('marks a line as verified with the switch', async () => {
        const onUpdateLine = renderVerification([line(1, NON_VERIFIEE)])

        fireEvent.click(screen.getByRole('checkbox', { name: NON_VERIFIEE }))

        await waitFor(() =>
            expect(onUpdateLine).toHaveBeenCalledWith(
                expect.objectContaining({ id: 1 }),
                { controle: VERIFIEE }
            )
        )
    })

    it('puts a verified line back with the switch', async () => {
        const onUpdateLine = renderVerification([line(1, VERIFIEE)])

        fireEvent.click(screen.getByRole('checkbox', { name: VERIFIEE }))

        await waitFor(() =>
            expect(onUpdateLine).toHaveBeenCalledWith(
                expect.objectContaining({ id: 1 }),
                { controle: NON_VERIFIEE }
            )
        )
    })

    it('cannot verify a line without ressource', () => {
        renderVerification([line(1, NON_VERIFIEE, [100], false)])

        expect(
            screen.getByRole<HTMLInputElement>('checkbox', {
                name: NON_VERIFIEE,
            }).disabled
        ).toBe(true)
        expect(
            screen.getByText('Ressource ou provenance manquante')
        ).toBeTruthy()
    })

    it('says when the switch could not be saved', async () => {
        renderVerification([line(1, NON_VERIFIEE)], () =>
            Promise.reject(new Error('Grist'))
        )

        fireEvent.click(screen.getByRole('checkbox', { name: NON_VERIFIEE }))

        expect((await screen.findByRole('alert')).textContent).toMatch(
            /Le contrôle de la ligne n'a pas pu être enregistré/
        )
    })

    it('saves the changes only with « Modifier »', async () => {
        const onUpdateLine = renderVerification([line(1, VERIFIEE)])

        fireEvent.click(screen.getByRole('button', { name: /^Modifier/ }))
        const percentage = within(dialog()).getByRole('textbox', {
            name: 'Répartition (%)',
        })
        fireEvent.change(percentage, { target: { value: '50' } })
        fireEvent.blur(percentage)

        expect(onUpdateLine).not.toHaveBeenCalled()

        fireEvent.click(
            within(dialog()).getByRole('button', { name: 'Modifier' })
        )

        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
        expect(onUpdateLine).toHaveBeenCalledOnce()
        expect(onUpdateLine).toHaveBeenCalledWith(
            expect.objectContaining({ id: 1 }),
            {
                parsedProvenance: expect.objectContaining({
                    distribution: [expect.objectContaining({ percentage: 50 })],
                }) as unknown,
            }
        )
    })

    it('saves nothing when the modal is cancelled', () => {
        const onUpdateLine = renderVerification([line(1, VERIFIEE)])

        fireEvent.click(screen.getByRole('button', { name: /^Modifier/ }))
        const percentage = within(dialog()).getByRole('textbox', {
            name: 'Répartition (%)',
        })
        fireEvent.change(percentage, { target: { value: '50' } })
        fireEvent.blur(percentage)
        fireEvent.click(
            within(dialog()).getByRole('button', { name: 'Annuler' })
        )

        expect(screen.queryByRole('dialog')).toBeNull()
        expect(onUpdateLine).not.toHaveBeenCalled()
    })

    it('says when the changes could not be saved', async () => {
        renderVerification([line(1, NON_VERIFIEE)], () =>
            Promise.reject(new Error('Grist'))
        )

        fireEvent.click(screen.getByRole('button', { name: /^Modifier/ }))
        const percentage = within(dialog()).getByRole('textbox', {
            name: 'Répartition (%)',
        })
        fireEvent.change(percentage, { target: { value: '50' } })
        fireEvent.blur(percentage)
        fireEvent.click(
            within(dialog()).getByRole('button', { name: 'Modifier' })
        )

        expect(
            (await within(dialog()).findByRole('alert')).textContent
        ).toMatch(/Les modifications n'ont pas pu être enregistrées/)
    })

    describe('import', () => {
        const importButton = () =>
            screen.queryByRole('button', { name: /^Importer les/ })

        it('waits for every line to be verified', () => {
            renderVerification([line(1, VERIFIEE), line(2, NON_VERIFIEE)])

            expect(importButton()).toBeNull()
        })

        it('imports the verified lines', async () => {
            const onImport = vi.fn(() => Promise.resolve())
            renderVerification(
                [line(1, VERIFIEE, [60, 40]), line(2, VERIFIEE)],
                undefined,
                onImport
            )

            fireEvent.click(
                screen.getByRole('button', {
                    name: 'Importer les 2 lignes vérifiées',
                })
            )
            expect(
                within(dialog()).getByText(
                    'Attention : 2 lignes du document vont créer 3 approvisionnements dans la table Approvisionnement de ce plan.'
                )
            ).toBeTruthy()
            fireEvent.click(
                within(dialog()).getByRole('button', {
                    name: 'Importer 3 approvisionnements',
                })
            )

            await waitFor(() =>
                expect(onImport).toHaveBeenCalledWith([
                    expect.objectContaining({ id: 1 }),
                    expect.objectContaining({ id: 2 }),
                ])
            )
        })

        it('says why the import failed', async () => {
            renderVerification([line(1, VERIFIEE)], undefined, () =>
                Promise.reject(new Error("L'import a échoué."))
            )

            fireEvent.click(
                screen.getByRole('button', {
                    name: 'Importer la ligne vérifiée',
                })
            )
            fireEvent.click(
                within(dialog()).getByRole('button', {
                    name: 'Importer 1 approvisionnement',
                })
            )

            expect(
                (await within(dialog()).findByRole('alert')).textContent
            ).toBe("L'import a échoué.")
        })
    })
})
