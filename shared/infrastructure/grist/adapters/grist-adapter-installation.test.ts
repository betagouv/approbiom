import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ColumnMajorTable } from '../helpers/grist-helpers'
import { createGristInstallationPort } from './grist-adapter-installation'

/** By default, one Installation row « Chaufferie » per installation the plans point at. */
function mockGrist(
    plans: ColumnMajorTable,
    installations: ColumnMajorTable = installationsOf(plans)
) {
    const fetchTable = vi.fn((tableId: string) =>
        Promise.resolve(tableId === 'Installation' ? installations : plans)
    )

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

function installationsOf(plans: ColumnMajorTable): ColumnMajorTable {
    const ids = [...new Set(plans.Installation as number[])].filter(
        (id) => id !== 0
    )

    return { id: ids, Nom: ids.map(() => 'Chaufferie') }
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
            { id: 7, nom: 'Chaufferie', commune: '87085' },
        ])
    })

    it('lists an installation once however many plans it supplies', async () => {
        mockGrist(plansPlacedAt(['87085', '87085', '87085'], [7, 7, 7]))

        await expect(createGristInstallationPort().list()).resolves.toEqual([
            { id: 7, nom: 'Chaufferie', commune: '87085' },
        ])
    })

    // 0 is Grist's empty reference.
    it('lists nothing for a plan naming no installation', async () => {
        mockGrist(plansPlacedAt(['87085', ''], [7, 0]))

        await expect(createGristInstallationPort().list()).resolves.toEqual([
            { id: 7, nom: 'Chaufferie', commune: '87085' },
        ])
    })

    // A numeric column stores 01001 as 1001.
    it('puts back the leading zero a numeric column drops', async () => {
        mockGrist(plansPlacedAt([1001, 9122, 87085]))

        await expect(communesOf()).resolves.toEqual(['01001', '09122', '87085'])
    })

    it('places an installation nowhere when the cell is empty', async () => {
        mockGrist(plansPlacedAt(['', null, undefined]))

        await expect(communesOf()).resolves.toEqual(['', '', ''])
    })

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

    // 975 is Saint-Pierre-et-Miquelon, a collectivité.
    it('refuses a collectivité', async () => {
        mockGrist(plansPlacedAt(['97501']))

        await expect(createGristInstallationPort().list()).rejects.toThrow(
            /not an INSEE commune code/
        )
    })

    // The column used to hold a département code.
    it('refuses a code that is not five characters wide', async () => {
        mockGrist(plansPlacedAt(['64']))

        await expect(createGristInstallationPort().list()).rejects.toThrow(
            /not an INSEE commune code/
        )
    })

    it('names the table and the column it refused', async () => {
        mockGrist(plansPlacedAt(['12345678']))

        await expect(createGristInstallationPort().list()).rejects.toThrow(
            /"Plan_d_approvisionnement".+"Code_Insee_Installation"/
        )
    })

    it('refuses the whole read for a single bad cell', async () => {
        mockGrist(plansPlacedAt(['87085', '96001', '75056']))

        await expect(createGristInstallationPort().list()).rejects.toThrow(
            /not an INSEE commune code/
        )
    })

    it('names an installation as the Installation table does', async () => {
        mockGrist(plansPlacedAt(['87085', '64024'], [7, 8]), {
            id: [7, 8],
            Nom: ['Chaufferie du Moulin', ''],
        })

        await expect(createGristInstallationPort().list()).resolves.toEqual([
            { id: 7, nom: 'Chaufferie du Moulin', commune: '87085' },
            { id: 8, nom: '', commune: '64024' },
        ])
    })

    it('places nowhere an installation no plan points at', async () => {
        mockGrist(plansPlacedAt(['87085'], [7]), {
            id: [7, 9],
            Nom: ['Chaufferie du Moulin', 'Chaufferie des Prés'],
        })

        await expect(createGristInstallationPort().list()).resolves.toEqual([
            { id: 7, nom: 'Chaufferie du Moulin', commune: '87085' },
            { id: 9, nom: 'Chaufferie des Prés', commune: '' },
        ])
    })

    it('refuses a document whose Installation table has no name', async () => {
        mockGrist(plansPlacedAt(['87085'], [7]), { id: [7] })

        await expect(createGristInstallationPort().list()).rejects.toThrow(
            /"Installation".+Nom/
        )
    })

    it('refuses a document whose plan table has no commune', async () => {
        const columns = plansPlacedAt(['87085'])
        delete columns.Code_Insee_Installation

        mockGrist(columns)

        await expect(createGristInstallationPort().list()).rejects.toThrow(
            /Code_Insee_Installation/
        )
    })
})
