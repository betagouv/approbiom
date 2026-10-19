import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ColumnMajorTable } from '../helpers/grist-helpers'
import { createGristPlanPort } from './grist-adapter-plan'

// The adapter reads `grist.docApi.fetchTable` and `grist.ready`, both installed
// by the Grist plugin script, which does not exist under jsdom.
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

/** One plan, with every cell overridable. */
function planTable(overrides: Record<string, unknown> = {}): ColumnMajorTable {
    const cells: Record<string, unknown> = {
        id: 1,
        Nom: 'RCU Val Fleuri',
        Installation: 7,
        Code_Insee_Installation: '87085',
        Type_de_plan: 'création',
        Usage_principal: 'énergie',
        Nature_Donnee: 'prévision',
        Statut: 'projet',
        est_Laureat: false,
        Cree_par: '',
        Cree_le: null,
        ...overrides,
    }

    return Object.fromEntries(
        Object.entries(cells).map(([colId, value]) => [colId, [value]])
    )
}

const firstPlan = async () => (await createGristPlanPort().list())[0]

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('createGristPlanPort', () => {
    it('reads a plan off the document', async () => {
        mockGrist(planTable())

        await expect(firstPlan()).resolves.toEqual({
            id: 1,
            nom: 'RCU Val Fleuri',
            installation: 7,
            typeDePlan: 'création',
            usage: 'énergie',
            natureDonnee: 'prévision',
            statut: 'projet',
            createdBy: null,
            createdAt: null,
        })
    })

    it('reads the fields asked for, and only those', async () => {
        mockGrist(planTable())

        const [plan] = await createGristPlanPort().list(['nom', 'statut'])

        expect(plan).toEqual({ nom: 'RCU Val Fleuri', statut: 'projet' })
    })

    // Where the plan sits is the commune of its installation, which the
    // installation port carries — the plan holds the reference and no more.
    it('carries the installation as a reference', async () => {
        mockGrist(planTable({ Installation: 12 }))

        await expect(firstPlan()).resolves.toMatchObject({ installation: 12 })
    })

    // Grist writes an empty reference as 0, which names no installation.
    it('reads no installation when the reference is empty', async () => {
        mockGrist(planTable({ Installation: null }))

        await expect(firstPlan()).resolves.toMatchObject({ installation: 0 })
    })

    // A usage the domain does not know is a column that has drifted, and every
    // screen reading it filters on a value it will never match. Left null, the
    // plan says « no usage » rather than an invented one.
    it('reads no usage from a value the domain does not know', async () => {
        mockGrist(planTable({ Usage_principal: 'chauffage urbain' }))

        await expect(firstPlan()).resolves.toMatchObject({ usage: null })
    })

    // The generated types are erased at build time, so a renamed column has to
    // fail here rather than fill every plan with blanks.
    it('refuses a document whose plan table is missing a column', async () => {
        const columns = planTable()
        delete columns.Statut

        mockGrist(columns)

        await expect(createGristPlanPort().list()).rejects.toThrow(/Statut/)
    })

    // What Grist sends when an access rule hides a column: only a widget that
    // reads it stops working.
    it('reads the fields asked for from a document that lacks the others', async () => {
        const columns = planTable()
        delete columns.Statut

        mockGrist(columns)

        await expect(createGristPlanPort().list(['nom'])).resolves.toEqual([
            { nom: 'RCU Val Fleuri' },
        ])
    })

    it('reads who created a plan, and when', async () => {
        mockGrist(
            planTable({
                Cree_par: 'claire.godel',
                // 16 October 2026, 15:39:26 in Paris: Grist sends seconds,
                // not milliseconds, and keeps the fraction.
                Cree_le: 1792157966.94359,
            })
        )

        await expect(
            createGristPlanPort().list(['createdBy', 'createdAt'])
        ).resolves.toEqual([
            {
                createdBy: 'claire.godel',
                createdAt: new Date(1792157966943.59),
            },
        ])
    })

    // Plans created before the tracking began: Grist leaves the Text column
    // empty and the DateTime one null.
    it('reads an untracked plan as created by no one, at no date', async () => {
        mockGrist(planTable({ Cree_par: '', Cree_le: null }))

        await expect(
            createGristPlanPort().list(['createdBy', 'createdAt'])
        ).resolves.toEqual([{ createdBy: null, createdAt: null }])
    })
})
