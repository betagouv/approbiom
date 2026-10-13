import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ColumnMajorTable } from '../helpers/grist-helpers'
import { METADATA_TABLE, TABLE } from '../types/grist-tables'
import { createGristAttachmentPort } from './grist-adapter-attachment'

const PIECES_JOINTES: ColumnMajorTable = {
    id: [1, 2],
    Plan_d_approvisionnement: [30, 35],
    piece_jointe: [
        ['L', 341],
        ['L', 342],
    ],
    type: ['excel ademe', 'excel ademe'],
}

const FILES: Record<number, { fileName: string; fileSize: number }> = {
    341: { fileName: 'plan-adapei.xlsx', fileSize: 1000 },
    342: { fileName: 'plan-poitiers.xlsx', fileSize: 2000 },
}

// The metadata table holds what Grist shows the user: every file for an
// owner, none for an editor of a document with access rules.
function mockGrist(visibleFiles: readonly number[]) {
    const tables: Record<string, ColumnMajorTable> = {
        [TABLE.attachment]: PIECES_JOINTES,
        [METADATA_TABLE.gristAttachment.id]: {
            id: [...visibleFiles],
            fileName: visibleFiles.map((id) => FILES[id].fileName),
            fileSize: visibleFiles.map((id) => FILES[id].fileSize),
        },
    }

    const getAccessToken = vi.fn(() =>
        Promise.resolve({ baseUrl: 'https://grist/api', token: 't' })
    )
    vi.stubGlobal('grist', {
        docApi: {
            fetchTable: vi.fn((tableId: string) =>
                Promise.resolve(tables[tableId])
            ),
            getAccessToken,
        },
        ready: vi.fn(),
        onOptions: (
            handler: (
                options: unknown,
                settings: { accessLevel: string }
            ) => void
        ) => handler({}, { accessLevel: 'full' }),
    })

    const fetchFile = vi.fn((url: string) => {
        const id = Number(/attachments\/(\d+)/.exec(url)?.[1])
        const file = FILES[id]

        return Promise.resolve(
            file
                ? new Response(JSON.stringify(file))
                : new Response('', { status: 404 })
        )
    })
    vi.stubGlobal('fetch', fetchFile)

    return { fetchFile, getAccessToken }
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('createGristAttachmentPort', () => {
    it('lists only the files of the plan asked for', async () => {
        mockGrist([341, 342])

        const attachments = await createGristAttachmentPort().listByPlan(35)

        expect(attachments).toEqual([
            {
                id: 342,
                planDApprovisionnement: 35,
                type: 'excel ademe',
                name: 'plan-poitiers.xlsx',
                sizeInBytes: 2000,
            },
        ])
    })

    it('reads the metadata table without asking the API when it shows the files', async () => {
        const { fetchFile } = mockGrist([341, 342])

        await createGristAttachmentPort().listByPlan(30)

        expect(fetchFile).not.toHaveBeenCalled()
    })

    it('asks the API for the files the metadata table hides', async () => {
        const { fetchFile } = mockGrist([])

        const attachments = await createGristAttachmentPort().listByPlan(30)

        expect(attachments.map(({ name }) => name)).toEqual([
            'plan-adapei.xlsx',
        ])
        expect(fetchFile).toHaveBeenCalledOnce()
        expect(fetchFile).toHaveBeenCalledWith(
            'https://grist/api/attachments/341?auth=t'
        )
    })

    it('asks for one access token for all the files the metadata table hides', async () => {
        const { fetchFile, getAccessToken } = mockGrist([])

        await createGristAttachmentPort().list()

        expect(fetchFile).toHaveBeenCalledTimes(2)
        expect(getAccessToken).toHaveBeenCalledOnce()
    })

    it('asks for no access token when the metadata table shows every file', async () => {
        const { getAccessToken } = mockGrist([341, 342])

        await createGristAttachmentPort().list()

        expect(getAccessToken).not.toHaveBeenCalled()
    })
})
