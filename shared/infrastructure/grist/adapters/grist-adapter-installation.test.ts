import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ColumnMajorTable } from '../grist-helpers'
import { createGristInstallationPort } from './grist-adapter-installation'

function mockGrist(columns: ColumnMajorTable) {
    const fetchTable = vi.fn().mockResolvedValue(columns)

    vi.stubGlobal('grist', {
        docApi: { fetchTable },
        ready: vi.fn(),
        onOptions: (
            handler: (
                options: unknown,
                settings: { accessLevel: string }
            ) => void
        ) => handler({}, { accessLevel: 'full' }),
    })

    return { fetchTable }
}

function plansPlacedAt(
    cells: readonly unknown[],
    refs?: readonly number[]
): ColumnMajorTable {
    const count = cells.length

    return {
        id: Array.from({ length: count }, (_, index) => index + 1),
        Nom: Array.from({ length: count }, () => 'RCU Val Fleuri'),
        Installation: refs
            ? [...refs]
            : Array.from({ length: count }, (_, index) => index + 1),
        Code_Insee_Installation: [...cells],
        Type_de_plan: Array.from({ length: count }, () => 'création'),
        Usage_principal: Array.from({ length: count }, () => 'énergie'),
        Nature_Donnee: Array.from({ length: count }, () => 'prévision'),
        Statut: Array.from({ length: count }, () => 'projet'),
        est_Laureat: Array.from({ length: count }, () => false),
    }
}

const communesOf = async () =>
    (await createGristInstallationPort().list()).map(({ commune }) => commune)

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('createGristInstallationPort', () => {
    // Five characters, whichever side of the sea the commune is on. The
    // département every screen sits a plan in is read out of them.
    it('reads the commune an installation sits at', async () => {
        mockGrist(plansPlacedAt(['64024', '87085', '2A004', '97411']))

        await expect(communesOf()).resolves.toEqual([
            '64024',
            '87085',
            '2A004',
            '97411',
        ])
    })

    it('lists an installation under the reference the plans point at', async () => {
        mockGrist(plansPlacedAt(['87085'], [7]))

        await expect(createGristInstallationPort().list()).resolves.toEqual([
            { id: 7, commune: '87085' },
        ])
    })

    // The commune rides on the plan row, so an installation supplying several
    // plans is read several times and must still be listed once.
    it('lists an installation once however many plans it supplies', async () => {
        mockGrist(plansPlacedAt(['87085', '87085', '87085'], [7, 7, 7]))

        await expect(createGristInstallationPort().list()).resolves.toEqual([
            { id: 7, commune: '87085' },
        ])
    })

    // 0 is Grist's empty reference: a plan naming no installation has none to
    // list, and listing one under 0 would gather every such plan into a site.
    it('lists nothing for a plan naming no installation', async () => {
        mockGrist(plansPlacedAt(['87085', ''], [7, 0]))

        await expect(createGristInstallationPort().list()).resolves.toEqual([
            { id: 7, commune: '87085' },
        ])
    })

    // Should the document hold the code in a numeric column, Grist stores
    // 01001 as the number 1001 and the leading zero — a width, not a digit —
    // has to be put back before the code names anything.
    it('puts back the leading zero a numeric column drops', async () => {
        mockGrist(plansPlacedAt([1001, 9122, 87085]))

        await expect(communesOf()).resolves.toEqual(['01001', '09122', '87085'])
    })

    // An installation the document places nowhere sits at no commune, and any
    // code put there in its stead would be an invention.
    it('places an installation nowhere when the cell is empty', async () => {
        mockGrist(plansPlacedAt(['', null, undefined]))

        await expect(communesOf()).resolves.toEqual(['', '', ''])
    })

    // A column holding something other than a commune code is wrong for every
    // installation at once, so it is refused rather than read as « nowhere ».
    it('refuses a code whose département is not one', async () => {
        mockGrist(plansPlacedAt(['96001']))

        await expect(createGristInstallationPort().list()).rejects.toThrow(
            /"96001", which is not an INSEE commune code/
        )
    })

    it('refuses the 20 Corsica left vacant', async () => {
        mockGrist(plansPlacedAt(['20004']))

        await expect(createGristInstallationPort().list()).rejects.toThrow(
            /not an INSEE commune code/
        )
    })

    // 975 is Saint-Pierre-et-Miquelon: a collectivité sitting between two codes
    // that are real départements, so only the rule can tell it apart.
    it('refuses a collectivité', async () => {
        mockGrist(plansPlacedAt(['97501']))

        await expect(createGristInstallationPort().list()).rejects.toThrow(
            /not an INSEE commune code/
        )
    })

    // A département code on its own is what the column used to hold. It is
    // half a commune code, and reading it as one would place every plan of the
    // document at a commune that does not exist.
    it('refuses a code that is not five characters wide', async () => {
        mockGrist(plansPlacedAt(['64']))

        await expect(createGristInstallationPort().list()).rejects.toThrow(
            /not an INSEE commune code/
        )
    })

    // The error has to say where to go, not merely that something is wrong.
    it('names the table and the column it refused', async () => {
        mockGrist(plansPlacedAt(['12345678']))

        await expect(createGristInstallationPort().list()).rejects.toThrow(
            /"Plan_d_approvisionnement".+"Code_Insee_Installation"/
        )
    })

    // One bad row condemns the load: the column is filled by the document, so
    // the rest are no more trustworthy than the one that gave itself away.
    it('refuses the whole read for a single bad cell', async () => {
        mockGrist(plansPlacedAt(['87085', '96001', '75056']))

        await expect(createGristInstallationPort().list()).rejects.toThrow(
            /not an INSEE commune code/
        )
    })

    // The column is filled by the document. If it is renamed or removed, this
    // must fail loudly rather than place every installation nowhere.
    it('refuses a document whose plan table has no commune', async () => {
        const columns = plansPlacedAt(['87085'])
        delete columns.Code_Insee_Installation

        mockGrist(columns)

        await expect(createGristInstallationPort().list()).rejects.toThrow(
            /Code_Insee_Installation/
        )
    })
})
