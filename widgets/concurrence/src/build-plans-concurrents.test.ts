import { describe, expect, it } from 'vitest'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import {
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
} from '@shared/core/domain/value-objects/provenance'
import {
    buildPlansConcurrents,
    type GetIsApprovisionnementRetenu,
} from './build-plans-concurrents'
import type { ConcurrenceRow } from './load-concurrence'

const SCIERIE_EXEMPLE = '11111111111111'
const FORET_FICTIVE = '22222222222222'

const denominationBySiret = new Map([
    [SCIERIE_EXEMPLE, 'Scierie Exemple'],
    [FORET_FICTIVE, 'Forêt Fictive'],
])

let nextId = 1
function approvisionnement(
    overrides: Partial<Approvisionnement> & { dep?: string }
): Approvisionnement {
    const { dep = '17', ...rest } = overrides

    return {
        id: nextId++,
        planDApprovisionnement: 1,
        ressource: '1A-PFA',
        provenance: { source: DEPARTEMENT_FRANCAIS, code: dep },
        fournisseur: SCIERIE_EXEMPLE,
        tonnageTotal: 100,
        ...rest,
    }
}

function row(
    planId: number,
    approvisionnements: readonly Approvisionnement[],
    overrides: Partial<ConcurrenceRow> = {}
): ConcurrenceRow {
    return {
        plan: {
            id: planId,
            nom: `Plan fictif ${planId}`,
            departementDeSituation: 'Charente-Maritime',
            installationCommune: null,
            statut: 'projet',
        },
        ressource: 'Plaquettes forestières',
        ressourceCode: '1A-PFA',
        ressourceFamille: '1 Bois coupé',
        approvisionnements,
        tonnageTotal: approvisionnements.reduce(
            (sum, { tonnageTotal }) => sum + tonnageTotal,
            0
        ),
        ...overrides,
    }
}

const tousRetenus: GetIsApprovisionnementRetenu = () => true
const provenance =
    (...deps: string[]): GetIsApprovisionnementRetenu =>
    ({ provenance }) =>
        provenance.source === DEPARTEMENT_FRANCAIS &&
        deps.includes(provenance.code)

describe('buildPlansConcurrents', () => {
    it('keeps everything retenu when no filter is set', () => {
        const [plan] = buildPlansConcurrents(
            [
                row(1, [
                    approvisionnement({ dep: '17', tonnageTotal: 200 }),
                    approvisionnement({ dep: '79', tonnageTotal: 300 }),
                ]),
            ],
            tousRetenus,
            denominationBySiret
        )

        expect(plan.ressources[0]).toEqual({
            nom: 'Plaquettes forestières',
            code: '1A-PFA',
            famille: '1 Bois coupé',
            provenances: { retenues: ['17', '79'], nonRetenues: [] },
            fournisseurs: { retenus: ['Scierie Exemple'], nonRetenus: [] },
            tonnageRetenu: 500,
            tonnageTotal: 500,
        })
    })

    it('splits provenances, fournisseurs and tonnage between retenus and non retenus', () => {
        const [plan] = buildPlansConcurrents(
            [
                row(1, [
                    approvisionnement({ dep: '17', tonnageTotal: 2500 }),
                    approvisionnement({
                        dep: '16',
                        fournisseur: FORET_FICTIVE,
                        tonnageTotal: 500,
                    }),
                ]),
            ],
            provenance('17'),
            denominationBySiret
        )

        expect(plan.ressources[0]).toMatchObject({
            provenances: { retenues: ['17'], nonRetenues: ['16'] },
            fournisseurs: {
                retenus: ['Scierie Exemple'],
                nonRetenus: ['Forêt Fictive'],
            },
            tonnageRetenu: 2500,
            tonnageTotal: 3000,
        })
    })

    it('counts a provenance as retenue once one of its approvisionnements is', () => {
        const [plan] = buildPlansConcurrents(
            [
                row(1, [
                    approvisionnement({ dep: '17' }),
                    approvisionnement({
                        dep: '17',
                        fournisseur: FORET_FICTIVE,
                    }),
                ]),
            ],
            ({ fournisseur }) => fournisseur === SCIERIE_EXEMPLE,
            denominationBySiret
        )

        expect(plan.ressources[0].provenances).toEqual({
            retenues: ['17'],
            nonRetenues: [],
        })
    })

    it('drops a plan with no approvisionnement retenu', () => {
        const plans = buildPlansConcurrents(
            [
                row(1, [approvisionnement({ dep: '17' })]),
                row(2, [approvisionnement({ dep: '33' })]),
            ],
            provenance('17'),
            denominationBySiret
        )

        expect(plans.map(({ plan }) => plan.id)).toEqual([1])
    })

    it('keeps the ressources without retenu of a plan that has some', () => {
        const [plan] = buildPlansConcurrents(
            [
                row(1, [approvisionnement({ dep: '17' })]),
                row(1, [approvisionnement({ dep: '86', tonnageTotal: 5800 })], {
                    ressource: 'Connexes de scierie',
                    ressourceCode: '2B-CIB',
                }),
            ],
            provenance('17'),
            denominationBySiret
        )

        expect(plan.ressources[1]).toMatchObject({
            nom: 'Connexes de scierie',
            provenances: { retenues: [], nonRetenues: ['86'] },
            tonnageRetenu: 0,
            tonnageTotal: 5800,
        })
    })

    it('groups by plan id, not by name', () => {
        const plans = buildPlansConcurrents(
            [
                row(1, [approvisionnement({})]),
                row(2, [approvisionnement({})], {
                    plan: { ...row(1, []).plan, id: 2 },
                }),
            ],
            tousRetenus,
            denominationBySiret
        )

        expect(plans).toHaveLength(2)
    })

    it('names a missing fournisseur « Non renseigné », listed last', () => {
        const [plan] = buildPlansConcurrents(
            [
                row(1, [
                    approvisionnement({ fournisseur: undefined }),
                    approvisionnement({ fournisseur: SCIERIE_EXEMPLE }),
                    approvisionnement({ fournisseur: FORET_FICTIVE }),
                ]),
            ],
            tousRetenus,
            denominationBySiret
        )

        expect(plan.ressources[0].fournisseurs.retenus).toEqual([
            'Forêt Fictive',
            'Scierie Exemple',
            'Non renseigné',
        ])
    })

    it('names each provenance once, in numeric order, countries included', () => {
        const [plan] = buildPlansConcurrents(
            [
                row(1, [
                    approvisionnement({ dep: '79' }),
                    approvisionnement({ dep: '9' }),
                    approvisionnement({ dep: '79' }),
                    approvisionnement({
                        provenance: {
                            source: PAYS_ETRANGER,
                            libelle: 'Espagne',
                        },
                    }),
                ]),
            ],
            tousRetenus,
            denominationBySiret
        )

        expect(plan.ressources[0].provenances.retenues).toEqual([
            '9',
            '79',
            'Espagne',
        ])
    })
})
