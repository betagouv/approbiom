import { describe, expect, it } from 'vitest'
import type {
    ApprovisionnementGroupedByPlanRessourceAndProvenance,
    ApprovisionnementGroupedByPlanAndRessource,
} from '@shared/core/application/ports/approvisionnement'
import { composeApprovisionnementStats } from '@shared/core/application/services/approvisionnement-stats'
import type { ApprovisionnementByRessourceStatsSources } from '@shared/core/application/services/approvisionnement-stats'

const PLAN = 1
const BOIS = '2017-1A-PFA'

function total(
    overrides: Partial<ApprovisionnementGroupedByPlanAndRessource> = {}
): ApprovisionnementGroupedByPlanAndRessource {
    return {
        planDApprovisionnement: PLAN,
        ressource: BOIS,
        tonnageTotal: 1000,
        repartition: 1,
        ...overrides,
    }
}

function provenance(
    overrides: Partial<ApprovisionnementGroupedByPlanRessourceAndProvenance> = {}
): ApprovisionnementGroupedByPlanRessourceAndProvenance {
    return { ...total(), provenance: '33', ...overrides }
}

function sources(
    overrides: Partial<ApprovisionnementByRessourceStatsSources> = {}
): ApprovisionnementByRessourceStatsSources {
    return {
        plan: PLAN,
        totals: [total()],
        byRegionOuPays: [],
        byProvenance: [],
        byFournisseur: [],
        ressources: [],
        entreprises: [],
        departementsByRegion: [
            {
                region: { reg: '75', libelle: 'Nouvelle-Aquitaine' },
                departements: [{ dep: '33', libelle: 'Gironde' }],
            },
        ],
        ...overrides,
    }
}

describe('composeApprovisionnementStats', () => {
    it('names a provenance and keeps the code it was read under', () => {
        const [stats] = composeApprovisionnementStats(
            sources({ byProvenance: [provenance({ provenance: '33' })] })
        )

        // The label is what the table shows; the code is what the map draws.
        expect(stats.byProvenance).toEqual([
            {
                label: 'Gironde',
                provenance: '33',
                tonnageTotal: 1000,
                repartition: 1,
            },
        ])
    })

    it('carries a provenance the référentiel does not name as it stands', () => {
        const [stats] = composeApprovisionnementStats(
            sources({ byProvenance: [provenance({ provenance: 'Espagne' })] })
        )

        expect(stats.byProvenance[0].label).toBe('Espagne')
        expect(stats.byProvenance[0].provenance).toBe('Espagne')
    })
})
