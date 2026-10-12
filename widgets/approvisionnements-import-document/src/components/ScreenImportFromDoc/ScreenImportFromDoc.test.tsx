import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import type { ExtractionSummary } from '@shared/core/application/ports/extracted-approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import {
    ApprovisionnementsNotCreatedError,
    ExtractedLinesNotDeletedError,
} from '@shared/core/application/services/import-extracted-approvisionnements'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import {
    NON_VERIFIEE,
    VERIFIEE,
} from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'
import { DEPARTEMENT_FRANCAIS } from '@shared/core/domain/value-objects/provenance'
import ScreenImportFromDoc, {
    type ScreenImportFromDocProps,
} from './ScreenImportFromDoc'
import type { ExtractedApprovisionnement } from '@shared/core/domain/entities/extracted-approvisionnement'

const PLAN = {
    id: 1,
    nom: 'Plan appro chaufferie Tulle 2024',
    typeDePlan: 'création',
    statut: 'projet',
    appelsAProjet: [],
}

const document = (id: number, name: string): Attachment => ({
    id,
    planDApprovisionnement: 1,
    type: 'excel ademe',
    name,
    sizeInBytes: 2048,
})

const RESSOURCE = {
    code: '1A-PFA',
    ademeCode: '2017-1A-PFA',
    title: 'Plaquettes forestières',
    description: '',
}

const NEW = document(20, 'nouveau.xlsx')
const STARTED = document(21, 'commence.xlsx')

const summary = (
    attachmentId: number,
    verifiedCount: number
): ExtractionSummary => ({
    attachmentId,
    extractedAt: new Date('2026-10-02T14:30:00'),
    lineCount: 3,
    verifiedCount,
})

const MESSAGE = '2 approvisionnements importés depuis 1 ligne du document.'

function choosePlan() {
    fireEvent.change(screen.getByRole('combobox', { name: /Plan/ }), {
        target: { value: 'Tulle' },
    })
    fireEvent.click(screen.getByRole('option', { name: /Tulle/ }))
}

const tab = (name: string) =>
    screen.getByRole<HTMLButtonElement>('tab', { name })

function renderScreen(
    props: Partial<ScreenImportFromDocProps> = {},
    { planChosen = true } = {}
) {
    const defaults: ScreenImportFromDocProps = {
        plans: [PLAN],
        attachments: [NEW, STARTED],
        extractions: new Map([[STARTED.id, summary(STARTED.id, 2)]]),
        imported: new Map(),
        getAttachmentUrl: () => Promise.resolve('data:,'),
        extractDocument: () =>
            Promise.resolve({
                lines: [],
                date: new Date('2026-10-09T10:05:00'),
            }),
        deleteExtraction: () => Promise.resolve(),
        updateExtractedApprovisionnement: (line) => Promise.resolve(line),
        entreprises: [],
        ressources: [],
        departementsByRegion: [],
        pays: [],
        onCreateEntreprise: () => Promise.resolve(),
        findEntrepriseBySiret: () => Promise.resolve({ status: 'notfound' }),
        onCreatePays: () => Promise.resolve(),
        importExtractedApprovisionnements: () => Promise.resolve([]),
        onExtractionsChanged: vi.fn(),
        onImported: vi.fn(),
    }
    const all = { ...defaults, ...props }
    render(<ScreenImportFromDoc {...all} />)
    if (planChosen) choosePlan()

    return all
}

const card = (name: string) =>
    screen.getByRole('button', { name: new RegExp(name) })

afterEach(cleanup)

describe('ScreenImportFromDoc', () => {
    it('asks for a plan first, with the later steps closed', () => {
        renderScreen({}, { planChosen: false })

        expect(
            screen.getByText(
                'Choisissez un plan pour afficher ses pièces jointes.'
            )
        ).toBeTruthy()
        expect(tab('2. Extraction').disabled).toBe(true)
        expect(tab('3. Vérification et import').disabled).toBe(true)
    })

    it('shows the plan chosen, then its documents', () => {
        renderScreen()

        expect(screen.getByRole('heading', { name: PLAN.nom })).toBeTruthy()
        expect(card('nouveau')).toBeTruthy()
        expect(card('commence')).toBeTruthy()
    })

    it('tells where each document stands', () => {
        renderScreen({ imported: new Map([[STARTED.id, 4]]) })

        expect(card('nouveau').querySelector('.fr-badge')).toBeNull()
        expect(
            within(card('commence')).getByText(/Vérification en cours/)
                .textContent
        ).toBe('Vérification en cours · 2/3')
        expect(
            within(card('commence')).getByText(/Déjà importé/).textContent
        ).toBe('Déjà importé · 4 approvisionnements')
    })

    it('says when the plan has no attachment', () => {
        renderScreen({ attachments: [] })

        expect(
            screen.getByText(/Aucune pièce jointe n'est liée à ce plan/)
        ).toBeTruthy()
        expect(
            screen.getByRole<HTMLButtonElement>('button', {
                name: 'Extraire les données',
            }).disabled
        ).toBe(true)
    })

    it('offers to resume a document already extracted', () => {
        renderScreen()

        fireEvent.click(card('commence'))

        expect(
            screen.getByRole('button', { name: 'Reprendre la vérification' })
        ).toBeTruthy()
        expect(
            screen.getByRole('button', { name: "Relancer l'extraction" })
        ).toBeTruthy()
    })

    it('extracts the document chosen', async () => {
        const { onExtractionsChanged } = renderScreen()

        fireEvent.click(card('nouveau'))
        fireEvent.click(
            screen.getByRole('button', { name: 'Extraire les données' })
        )

        expect(tab('2. Extraction').getAttribute('aria-selected')).toBe('true')
        expect(screen.getByText('Extraction en cours…')).toBeTruthy()
        expect(
            await screen.findByText(/0 ligne extraite le 09\/10\/2026 à 10h05/)
        ).toBeTruthy()
        expect(
            tab('3. Vérification et import').getAttribute('aria-selected')
        ).toBe('true')
        expect(onExtractionsChanged).toHaveBeenCalled()
    })

    it('says why an extraction failed, and lets another document be chosen', async () => {
        renderScreen({
            extractDocument: () =>
                Promise.reject(
                    new Error("la feuille « Fournisseurs » n'existe pas")
                ),
        })

        fireEvent.click(card('nouveau'))
        fireEvent.click(
            screen.getByRole('button', { name: 'Extraire les données' })
        )

        expect(
            await screen.findByText("la feuille « Fournisseurs » n'existe pas")
        ).toBeTruthy()
        fireEvent.click(
            screen.getByRole('button', { name: 'Choisir un autre document' })
        )
        expect(card('nouveau')).toBeTruthy()
        expect(tab('3. Vérification et import').disabled).toBe(true)
    })

    it('drops the lines before extracting again', async () => {
        const deleteExtraction = vi.fn(() => Promise.resolve())
        const extractDocument = vi.fn(() =>
            Promise.resolve({ lines: [], date: new Date() })
        )
        renderScreen({ deleteExtraction, extractDocument })

        fireEvent.click(card('commence'))
        fireEvent.click(
            screen.getByRole('button', { name: "Relancer l'extraction" })
        )
        fireEvent.click(
            within(screen.getByRole('dialog')).getByRole('button', {
                name: "Relancer l'extraction",
            })
        )

        expect(await screen.findByText('Extraction en cours…')).toBeTruthy()
        expect(deleteExtraction).toHaveBeenCalledWith(STARTED)
        expect(extractDocument).toHaveBeenCalledWith(STARTED)
    })

    it('goes back to the documents, then closes the later steps when another document is chosen', async () => {
        renderScreen()

        fireEvent.click(card('nouveau'))
        fireEvent.click(
            screen.getByRole('button', { name: 'Extraire les données' })
        )
        await screen.findByText(/0 ligne extraite/)

        fireEvent.click(tab('1. Sélection du document'))
        expect(card('nouveau')).toBeTruthy()
        expect(tab('3. Vérification et import').disabled).toBe(false)

        fireEvent.click(card('commence'))
        expect(tab('2. Extraction').disabled).toBe(true)
        expect(tab('3. Vérification et import').disabled).toBe(true)
    })

    it('verifies a line saved with « Modifier »', async () => {
        const updateExtractedApprovisionnement = vi.fn(
            (line: ExtractedApprovisionnement) =>
                Promise.resolve({ ...line, controle: VERIFIEE })
        )
        const reviewedLine: ExtractedApprovisionnement = {
            id: 7,
            controle: NON_VERIFIEE,
            extractedAt: new Date(),
            read: {
                document: 'commence.xlsx',
                excelRow: 17,
                supplier: 'Scierie',
                resource: 'Plaquettes',
                tonnage: 100,
                rawProvenance: '',
                additionalData: '',
            },
            derived: {
                parsedProvenance: {
                    distribution: [
                        {
                            source: DEPARTEMENT_FRANCAIS,
                            provenance: '19',
                            percentage: 100,
                        },
                    ],
                    confidence: 'Explicite',
                    unrecognized: [],
                },
                matchedFournisseur: null,
                matchedRessource: null,
            },
        }
        renderScreen({
            updateExtractedApprovisionnement,
            ressources: [RESSOURCE],
            extractDocument: () =>
                Promise.resolve({ lines: [reviewedLine], date: new Date() }),
        })

        fireEvent.click(card('commence'))
        fireEvent.click(
            screen.getByRole('button', { name: 'Reprendre la vérification' })
        )
        fireEvent.click(
            await screen.findByRole('button', { name: /^Modifier/ })
        )
        const list = within(screen.getByRole('dialog')).getByRole('combobox', {
            name: /Ressource/,
        })
        const option = within(list).getByRole('option', {
            name: '1A-PFA · Plaquettes forestières',
        })
        fireEvent.change(list, {
            target: { value: option.getAttribute('value') },
        })
        fireEvent.click(
            within(screen.getByRole('dialog')).getByRole('button', {
                name: 'Modifier',
            })
        )

        await waitFor(() =>
            expect(updateExtractedApprovisionnement).toHaveBeenCalledWith(
                reviewedLine,
                { matchedRessource: RESSOURCE }
            )
        )
        expect(
            await screen.findByRole('checkbox', { name: VERIFIEE })
        ).toBeTruthy()
    })

    describe('import', () => {
        const verified = (): ExtractedApprovisionnement => ({
            id: 8,
            controle: VERIFIEE,
            extractedAt: new Date(),
            read: {
                document: 'commence.xlsx',
                excelRow: 18,
                supplier: 'Scierie',
                resource: 'Plaquettes',
                tonnage: 1000,
                rawProvenance: '',
                additionalData: 'PCI: 2,8',
            },
            derived: {
                parsedProvenance: {
                    distribution: [
                        {
                            source: DEPARTEMENT_FRANCAIS,
                            provenance: '19',
                            percentage: 60,
                        },
                        {
                            source: DEPARTEMENT_FRANCAIS,
                            provenance: '23',
                            percentage: 40,
                        },
                    ],
                    confidence: 'Explicite',
                    unrecognized: [],
                },
                matchedFournisseur: null,
                matchedRessource: RESSOURCE,
            },
        })

        async function importAll(props: Partial<ScreenImportFromDocProps>) {
            const all = renderScreen({
                extractDocument: () =>
                    Promise.resolve({ lines: [verified()], date: new Date() }),
                ...props,
            })
            fireEvent.click(card('commence'))
            fireEvent.click(
                screen.getByRole('button', {
                    name: 'Reprendre la vérification',
                })
            )
            fireEvent.click(
                await screen.findByRole('button', {
                    name: 'Importer la ligne vérifiée',
                })
            )
            fireEvent.click(
                within(screen.getByRole('dialog')).getByRole('button', {
                    name: 'Importer 2 approvisionnements',
                })
            )

            return all
        }

        const created = [{ id: 101 }, { id: 102 }] as Approvisionnement[]

        it('imports the lines, then says what was imported', async () => {
            const importExtractedApprovisionnements = vi.fn(() =>
                Promise.resolve(created)
            )

            const { onImported } = await importAll({
                importExtractedApprovisionnements,
            })

            expect(await screen.findByText(MESSAGE)).toBeTruthy()
            expect(
                tab('1. Sélection du document').getAttribute('aria-selected')
            ).toBe('true')
            expect(tab('2. Extraction').disabled).toBe(true)
            expect(tab('3. Vérification et import').disabled).toBe(true)
            expect(onImported).toHaveBeenCalled()
            expect(importExtractedApprovisionnements).toHaveBeenCalledWith(
                [expect.objectContaining({ id: 8 })],
                PLAN.id,
                STARTED.id
            )
        })

        it('says nothing was created when the creation fails', async () => {
            const { onImported } = await importAll({
                importExtractedApprovisionnements: () =>
                    Promise.reject(new ApprovisionnementsNotCreatedError()),
            })

            expect(
                (await within(screen.getByRole('dialog')).findByRole('alert'))
                    .textContent
            ).toBe(
                "L'import a échoué. Aucun approvisionnement n'a été créé. Réessayez."
            )
            expect(onImported).not.toHaveBeenCalled()
        })

        it('goes back to the documents, warning not to import again, when the lines cannot be deleted', async () => {
            const { onImported, onExtractionsChanged } = await importAll({
                importExtractedApprovisionnements: () =>
                    Promise.reject(new ExtractedLinesNotDeletedError(created)),
            })

            expect(
                await screen.findByText(
                    /^2 approvisionnements créés.*Ne les importez pas une seconde fois/
                )
            ).toBeTruthy()
            expect(onImported).toHaveBeenCalled()
            expect(onExtractionsChanged).toHaveBeenCalled()
        })
    })
})
