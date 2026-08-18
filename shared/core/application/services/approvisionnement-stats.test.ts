import { describe, expect, it } from 'vitest'
import {
    composeApprovisionnementStats,
    type ApprovisionnementStatsSources,
} from '@shared/core/application/services/approvisionnement-stats'

const PLAQUETTES = 'PF'
const ECORCES = 'EC'

function sources(
    overrides: Partial<ApprovisionnementStatsSources> = {}
): ApprovisionnementStatsSources {
    return {
        plan: 1,
        totals: [
            {
                planDApprovisionnement: 1,
                ressource: PLAQUETTES,
                tonnageTotal: 120,
                repartition: 0.75,
            },
            {
                planDApprovisionnement: 1,
                ressource: ECORCES,
                tonnageTotal: 40,
                repartition: 0.25,
            },
            {
                planDApprovisionnement: 2,
                ressource: PLAQUETTES,
                tonnageTotal: 999,
                repartition: 1,
            },
        ],
        byRegion: [],
        byDepartement: [],
        byFournisseur: [],
        ressources: [
            { code: PLAQUETTES, title: 'Plaquettes forestières' },
            { code: ECORCES, title: 'Écorces' },
        ],
        entreprises: [
            { siret: '12345678900011', denomination: 'Scierie Nord' },
        ],
        departementsByRegion: [
            {
                region: { reg: '75', libelle: 'Nouvelle-Aquitaine' },
                departements: [{ dep: '87', libelle: 'Haute-Vienne' }],
            },
        ],
        ...overrides,
    }
}

describe('composeApprovisionnementStats', () => {
    it('reads only the plan it was asked for', () => {
        const stats = composeApprovisionnementStats(sources())

        expect(stats.plan).toBe(1)
        expect(
            stats.byRessource.map(({ ressource }) => ressource.code)
        ).toEqual([PLAQUETTES, ECORCES])
    })

    it('totals what the plan draws, across its ressources', () => {
        expect(composeApprovisionnementStats(sources()).tonnageTotal).toBe(160)
    })

    it('names a ressource by its title rather than by its code', () => {
        const [plaquettes] =
            composeApprovisionnementStats(sources()).byRessource

        expect(plaquettes.ressource.title).toBe('Plaquettes forestières')
    })

    it('files each group under the ressource it belongs to', () => {
        const stats = composeApprovisionnementStats(
            sources({
                byRegion: [
                    {
                        planDApprovisionnement: 1,
                        ressource: PLAQUETTES,
                        region: 'Nouvelle-Aquitaine',
                        tonnageTotal: 120,
                        repartition: 1,
                    },
                    {
                        planDApprovisionnement: 1,
                        ressource: ECORCES,
                        region: 'Bretagne',
                        tonnageTotal: 40,
                        repartition: 1,
                    },
                    // Another plan's group has nothing to do here.
                    {
                        planDApprovisionnement: 2,
                        ressource: PLAQUETTES,
                        region: 'Occitanie',
                        tonnageTotal: 999,
                        repartition: 1,
                    },
                ],
            })
        )

        const [plaquettes, ecorces] = stats.byRessource

        expect(plaquettes.byRegion.map(({ label }) => label)).toEqual([
            'Nouvelle-Aquitaine',
        ])
        expect(ecorces.byRegion.map(({ label }) => label)).toEqual(['Bretagne'])
    })

    it('names a département by its libellé', () => {
        const stats = composeApprovisionnementStats(
            sources({
                byDepartement: [
                    {
                        planDApprovisionnement: 1,
                        ressource: PLAQUETTES,
                        departement: '87',
                        tonnageTotal: 120,
                        repartition: 1,
                    },
                ],
            })
        )

        expect(stats.byRessource[0].byDepartement[0].label).toBe('Haute-Vienne')
    })

    it('names a fournisseur by its dénomination', () => {
        const stats = composeApprovisionnementStats(
            sources({
                byFournisseur: [
                    {
                        planDApprovisionnement: 1,
                        ressource: PLAQUETTES,
                        fournisseur: '12345678900011',
                        tonnageTotal: 120,
                        repartition: 1,
                    },
                ],
            })
        )

        expect(stats.byRessource[0].byFournisseur[0].label).toBe('Scierie Nord')
    })

    it('keeps a reading the directory cannot name, under the code it carries', () => {
        const stats = composeApprovisionnementStats(
            sources({
                byFournisseur: [
                    {
                        planDApprovisionnement: 1,
                        ressource: PLAQUETTES,
                        fournisseur: '99999999900099',
                        tonnageTotal: 120,
                        repartition: 1,
                    },
                ],
            })
        )

        // A siret nobody names is still a fournisseur: it is read by its siret
        // rather than dropped from the breakdown.
        expect(stats.byRessource[0].byFournisseur[0].label).toBe(
            '99999999900099'
        )
    })

    it('reads a row naming nothing at all as unknown', () => {
        const stats = composeApprovisionnementStats(
            sources({
                byRegion: [
                    {
                        planDApprovisionnement: 1,
                        ressource: PLAQUETTES,
                        region: '',
                        tonnageTotal: 120,
                        repartition: 1,
                    },
                ],
            })
        )

        expect(stats.byRessource[0].byRegion[0].label).toBe('Inconnu')
    })

    it('reads a plan it has no total for as empty, not as an error', () => {
        const stats = composeApprovisionnementStats(sources({ plan: 404 }))

        expect(stats.byRessource).toEqual([])
        expect(stats.tonnageTotal).toBe(0)
    })
})
