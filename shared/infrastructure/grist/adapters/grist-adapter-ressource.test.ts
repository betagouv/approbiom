import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ColumnMajorTable } from '../helpers/grist-helpers'
import {
    createGristRessourcePort,
    createGristRessourcesPort,
} from './grist-adapter-ressource'

const SANS_FAMILLE: ColumnMajorTable = {
    id: [1],
    Code_ressource_Approbiom: ['2B-CIB'],
    ademe_2017: ['2017-2B-CIB'],
    Description_courte: ['Connexes de scierie'],
    Description: ['Produits connexes de scierie hors écorces'],
}

function mockMetaRessource(columns: ColumnMajorTable) {
    vi.stubGlobal('grist', {
        docApi: { fetchTable: vi.fn().mockResolvedValue(columns) },
        ready: vi.fn(),
        onOptions: (
            handler: (
                options: unknown,
                settings: { accessLevel: string }
            ) => void
        ) => handler({}, { accessLevel: 'full' }),
    })
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('createGristRessourcesPort().list', () => {
    it('gives only the properties asked for', async () => {
        mockMetaRessource({
            ...SANS_FAMILLE,
            Famille_ressource: ['2 Coproduits 1ère transfo Bois'],
        })

        expect(
            await createGristRessourcesPort().list(['code', 'famille'])
        ).toEqual([
            { code: '2B-CIB', famille: '2 Coproduits 1ère transfo Bois' },
        ])
    })

    it('fails when a column asked for is missing from the document', async () => {
        mockMetaRessource(SANS_FAMILLE)

        await expect(
            createGristRessourcesPort().list(['code', 'famille'])
        ).rejects.toThrow('Famille_ressource')
    })

    it('ignores a missing column nobody asks for', async () => {
        mockMetaRessource(SANS_FAMILLE)

        expect(await createGristRessourcesPort().list(['title'])).toEqual([
            { title: 'Connexes de scierie' },
        ])
    })

    it('reads an empty cell as an empty text', async () => {
        mockMetaRessource({ ...SANS_FAMILLE, Famille_ressource: [null] })

        expect(await createGristRessourcesPort().list(['famille'])).toEqual([
            { famille: '' },
        ])
    })
})

describe('createGristRessourcePort().list', () => {
    it('does not need the « Famille ressource » column', async () => {
        mockMetaRessource(SANS_FAMILLE)

        expect(await createGristRessourcePort().list()).toEqual([
            {
                code: '2B-CIB',
                ademeCode: '2017-2B-CIB',
                title: 'Connexes de scierie',
                famille: '',
                description: 'Produits connexes de scierie hors écorces',
            },
        ])
    })
})
