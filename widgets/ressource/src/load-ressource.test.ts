import { describe, expect, it } from 'vitest'
import type { PlanDApprovisionnement } from '@shared/core/domain/entities/plan-d-approvisionnement'
import type { Installation } from '@shared/core/domain/entities/installation'
import { loadRessource } from './load-ressource'

const PLAN: PlanDApprovisionnement = {
    id: 1,
    nom: 'RCU Val Fleuri',
    installation: 10,
    typeDePlan: 'création',
    usage: 'énergie',
    natureDonnee: 'prévision',
    statut: 'projet',
    createdBy: null,
    createdAt: null,
}

const INSTALLATION: Installation = {
    id: 10,
    nom: 'Chaufferie du Moulin',
    commune: '69123',
}

describe('loadRessource', () => {
    it('reads the plans and the installations the screen is drawn from', async () => {
        await expect(
            loadRessource({
                plans: { list: () => Promise.resolve([PLAN]) },
                installations: { list: () => Promise.resolve([INSTALLATION]) },
            })
        ).resolves.toEqual({ plans: [PLAN], installations: [INSTALLATION] })
    })

    it('fails when one of the reads fails', async () => {
        await expect(
            loadRessource({
                plans: { list: () => Promise.resolve([PLAN]) },
                installations: {
                    list: () => Promise.reject(new Error('unreachable')),
                },
            })
        ).rejects.toThrow('unreachable')
    })
})
