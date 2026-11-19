import { describe, expect, it, vi } from 'vitest'
import { FAKE_PORTS } from './fake-data/ports'
import { FAKE_ENTREPRISES } from './fake-data/entreprises'
import { FAKE_RESSOURCES } from './fake-data/ressources'
import { FAKE_DEPARTEMENTS_BY_REGION } from './fake-data/departements'
import type { Ports } from './ports'
import { loadApprovisionnementsSaisieManuelle } from './load-approvisionnements-saisie-manuelle'

describe('loadApprovisionnementsSaisieManuelle', () => {
    it('reads every list the screen needs', async () => {
        const screen = await loadApprovisionnementsSaisieManuelle(FAKE_PORTS)

        expect(screen.entreprises).toEqual(FAKE_ENTREPRISES)
        expect(screen.ressources).toEqual(FAKE_RESSOURCES)
        expect(screen.departementsByRegion).toEqual(FAKE_DEPARTEMENTS_BY_REGION)
        expect(screen.plans.length).toBeGreaterThan(0)
        expect(screen.approvisionnements).toEqual(
            await FAKE_PORTS.approvisionnements.list()
        )
    })

    it('hands the writes over to the ports it was loaded with', async () => {
        const remove = vi.fn(() => Promise.resolve())
        const listByPlan = vi.fn(() => Promise.resolve([]))
        const ports: Ports = {
            ...FAKE_PORTS,
            approvisionnements: {
                ...FAKE_PORTS.approvisionnements,
                delete: remove,
            },
            attachments: { listByPlan },
        }

        const screen = await loadApprovisionnementsSaisieManuelle(ports)
        await screen.deleteApprovisionnement(7)
        await screen.listAttachments(3)

        expect(remove).toHaveBeenCalledWith(7)
        expect(listByPlan).toHaveBeenCalledWith(3)
    })
})
