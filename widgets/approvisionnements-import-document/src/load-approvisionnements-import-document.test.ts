import { describe, expect, it, vi } from 'vitest'
import { FAKE_PORTS } from './fake-data/ports'
import { FAKE_ENTREPRISES } from './fake-data/entreprises'
import { FAKE_RESSOURCES } from './fake-data/ressources'
import type { Ports } from './ports'
import { loadApprovisionnementsImportDocument } from './load-approvisionnements-import-document'

describe('loadApprovisionnementsImportDocument', () => {
    it('reads every list the screen needs', async () => {
        const screen = await loadApprovisionnementsImportDocument(FAKE_PORTS)

        expect(screen.entreprises).toEqual(FAKE_ENTREPRISES)
        expect(screen.ressources).toEqual(FAKE_RESSOURCES)
        expect(screen.plans.length).toBeGreaterThan(0)
        expect(screen.extractions).toEqual(
            await FAKE_PORTS.extractedApprovisionnements.listSummaries()
        )
    })

    it('hands the attachment reads over to the ports it was loaded with', async () => {
        const getFileUrl = vi.fn(() =>
            Promise.resolve('https://grist.example.fr/fichier/12')
        )
        const ports: Ports = {
            ...FAKE_PORTS,
            attachments: { ...FAKE_PORTS.attachments, getFileUrl },
        }

        const screen = await loadApprovisionnementsImportDocument(ports)

        await expect(screen.getAttachmentUrl(12)).resolves.toBe(
            'https://grist.example.fr/fichier/12'
        )
        expect(getFileUrl).toHaveBeenCalledWith(12)
    })
})
