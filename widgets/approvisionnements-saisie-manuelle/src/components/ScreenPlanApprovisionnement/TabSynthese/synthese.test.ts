import { describe, expect, it } from 'vitest'
import type { ApprovisionnementRow } from '../../../approvisionnement-rows'
import { toSynthese } from './synthese'

let nextId = 1
const row = (
    provenance: string,
    fournisseur: string | null,
    tonnage: number
): ApprovisionnementRow => ({
    id: nextId++,
    fournisseur,
    ressource: '1A-PFA · Plaquettes forestières',
    provenance,
    tonnage,
    duplicate: null,
})

describe('toSynthese', () => {
    it('adds up the tonnage of each provenance, heaviest first', () => {
        const { total, byProvenance } = toSynthese([
            row('Corrèze (19)', 'A', 100),
            row('Creuse (23)', 'A', 300),
            row('Corrèze (19)', 'B', 600),
        ])

        expect(total).toBe(1000)
        expect(byProvenance).toEqual([
            { label: 'Corrèze (19)', tonnage: 700, percentage: 70 },
            { label: 'Creuse (23)', tonnage: 300, percentage: 30 },
        ])
    })

    it('keeps the fournisseur the plan does not give apart', () => {
        const { byFournisseur } = toSynthese([
            row('Corrèze (19)', null, 250),
            row('Corrèze (19)', 'A', 750),
            row('Creuse (23)', null, 0),
        ])

        expect(byFournisseur).toEqual([
            { label: 'A', tonnage: 750, percentage: 75 },
            { label: null, tonnage: 250, percentage: 25 },
        ])
    })

    it('weighs nothing anywhere when every tonnage is zero', () => {
        const { byProvenance } = toSynthese([row('Corrèze (19)', 'A', 0)])

        expect(byProvenance).toEqual([
            { label: 'Corrèze (19)', tonnage: 0, percentage: 0 },
        ])
    })
})
