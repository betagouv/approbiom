import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { GristAttachmentRecord } from '@shared/infrastructure/grist/grist-on-record-attachment'
import { ATTACHMENT_TYPE_IMPORT } from '@shared/core/domain/value-objects/attachment-type'

type OnRecord = (record: unknown) => void

const NAME_FILE = 'BCIAT_2024.xlsx'

const excelAdeme: Attachment = {
    id: 12,
    planDApprovisionnement: 3,
    type: ATTACHMENT_TYPE_IMPORT,
    name: NAME_FILE,
    sizeInBytes: 4096,
}
const NOM_PLAN_D_APPROVISIONNEMENT = 'Chaudière Limousin G'

const PIECE_JOINTE: Partial<GristAttachmentRecord> = {
    id: 1,
    Plan_d_approvisionnement: NOM_PLAN_D_APPROVISIONNEMENT,
    piece_jointe: [excelAdeme.id],
    type: ATTACHMENT_TYPE_IMPORT,
}

const pieceJointeRow = (overrides: Record<string, unknown> = {}) => ({
    ...PIECE_JOINTE,
    ...overrides,
})

function mockGrist() {
    let onRecord: OnRecord = () => {}

    vi.stubGlobal('grist', {
        ready: vi.fn(),
        onOptions: (
            handler: (
                options: unknown,
                settings: { accessLevel: string }
            ) => void
        ) => handler({}, { accessLevel: 'full' }),
        onRecord: (callback: OnRecord) => {
            onRecord = callback
        },
    })

    return {
        moveCursorTo: (record: unknown) =>
            act(() => {
                onRecord(record)
            }),
    }
}

async function renderApp(findOne: (id: number) => Promise<Attachment>) {
    vi.resetModules()

    const { default: App } = await import('./App')

    render(
        <App
            attachments={{
                findOne,
                getFileUrl: () =>
                    Promise.reject(
                        new Error('no file is downloaded by these tests')
                    ),
            }}
        />
    )

    await screen.findByRole('alert')
}

const neverRead = () =>
    Promise.reject(new Error('no attachment is read by this test'))

afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
})

describe('Import widget', () => {
    it('reports a table whose columns are not the expected ones', async () => {
        const { moveCursorTo } = mockGrist()
        await renderApp(neverRead)

        moveCursorTo({ id: PIECE_JOINTE['id'], Autre_colonne: 'x' })

        expect((await screen.findByRole('alert')).textContent).toMatch(
            /colonnes de la table Pièce Jointe/i
        )
    })

    it('reports a row that carries no attachment', async () => {
        const { moveCursorTo } = mockGrist()
        await renderApp(neverRead)

        moveCursorTo(pieceJointeRow({ piece_jointe: null }))

        expect((await screen.findByRole('alert')).textContent).toContain(
            'Cette ligne ne contient aucune pièce jointe.'
        )
    })

    it('reports an attachment the document cannot hand over', async () => {
        const { moveCursorTo } = mockGrist()
        await renderApp(() =>
            Promise.reject(new Error('Grist attachment 12 could not be read'))
        )

        moveCursorTo(pieceJointeRow())

        expect((await screen.findByRole('alert')).textContent).toContain(
            "La pièce jointe sélectionnée n'a pas pu être lue : Grist attachment 12 could not be read"
        )
    })

    it('replaces the error with the attachment once it is read', async () => {
        const { moveCursorTo } = mockGrist()
        await renderApp(() => Promise.resolve(excelAdeme))

        moveCursorTo(pieceJointeRow())

        expect(await screen.findByText(/BCIAT_2024\.xlsx/)).toBeDefined()
        expect(screen.queryByRole('alert')).toBeNull()
    })
})
