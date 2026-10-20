import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ColumnMajorTable } from '../helpers/grist-helpers'
import { createGristUtilisateurPort } from './grist-adapter-utilisateur'

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

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('createGristUtilisateurPort', () => {
    it('reads the email of each user, and whether they use Approbiom', async () => {
        mockGrist({
            id: [1, 2],
            Email: ['camille.martin@example.fr', 'admin@example.fr'],
            Prenom: ['Camille', 'Dominique'],
            Utilisateur_Approbiom: [true, false],
        })

        await expect(createGristUtilisateurPort().list()).resolves.toEqual([
            {
                id: 1,
                email: 'camille.martin@example.fr',
                utilisateurApprobiom: true,
            },
            { id: 2, email: 'admin@example.fr', utilisateurApprobiom: false },
        ])
    })

    // A row added before the column existed, or never touched since.
    it('reads an unset « Utilisateur Approbiom » as not ticked', async () => {
        mockGrist({
            id: [1],
            Email: ['camille.martin@example.fr'],
            Utilisateur_Approbiom: [null],
        })

        const [utilisateur] = await createGristUtilisateurPort().list()

        expect(utilisateur?.utilisateurApprobiom).toBe(false)
    })

    it('reads a row without an email as an empty one', async () => {
        mockGrist({ id: [1], Email: [null], Utilisateur_Approbiom: [true] })

        const [utilisateur] = await createGristUtilisateurPort().list()

        expect(utilisateur?.email).toBe('')
    })
})
