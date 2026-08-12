import { describe, expect, it } from 'vitest'
import type { Installation } from '@shared/application/domain/installation'
import type { DepartementsByRegion } from './departements-by-region'
import type { Plan } from './plan'
import { getRegionByPlan } from './region-by-plan'

const saintJunien: Plan = {
    id: 1,
    nom: 'RC Saint Junien',
    installation: 10,
    typeDePlan: 'création',
    usage: 'énergie',
    natureDonnee: 'prévision',
    statut: 'en fonctionnement',
}

const chaufferieDeSaintJunien: Installation = {
    id: 10,
    nom: 'Chaufferie de Saint-Junien',
    commune: { com: '87154', libelle: 'Saint-Junien', dep: '87' },
}

const nouvelleAquitaine: DepartementsByRegion = {
    region: { reg: '75', libelle: 'Nouvelle-Aquitaine' },
    departements: [
        { dep: '87', libelle: 'Haute-Vienne' },
        { dep: '33', libelle: 'Gironde' },
    ],
}

describe('getRegionByPlan', () => {
    it('follows the plan to its installation, its commune and its région', () => {
        const regions = getRegionByPlan(
            [saintJunien],
            [chaufferieDeSaintJunien],
            [nouvelleAquitaine]
        )

        expect(regions.get(saintJunien.id)).toBe('Nouvelle-Aquitaine')
    })

    it('leaves out a plan whose installation is missing', () => {
        const regions = getRegionByPlan([saintJunien], [], [nouvelleAquitaine])

        // Not « région inconnue » under some other name: absent from the map is
        // what the caller reads as « we cannot say ».
        expect(regions.has(saintJunien.id)).toBe(false)
    })

    it('leaves out a plan whose commune names no département', () => {
        const regions = getRegionByPlan(
            [saintJunien],
            [
                {
                    ...chaufferieDeSaintJunien,
                    commune: { com: '', libelle: '', dep: '' },
                },
            ],
            [nouvelleAquitaine]
        )

        expect(regions.has(saintJunien.id)).toBe(false)
    })

    it('leaves out a plan whose département is unknown to the INSEE tables', () => {
        const regions = getRegionByPlan(
            [saintJunien],
            [
                {
                    ...chaufferieDeSaintJunien,
                    commune: { com: '99999', libelle: 'Ailleurs', dep: '99' },
                },
            ],
            [nouvelleAquitaine]
        )

        expect(regions.has(saintJunien.id)).toBe(false)
    })

    it('maps every plan it is given, not just the first', () => {
        const bordeaux: Plan = {
            ...saintJunien,
            id: 2,
            nom: 'RC Bordeaux',
            installation: 20,
        }

        const regions = getRegionByPlan(
            [saintJunien, bordeaux],
            [
                chaufferieDeSaintJunien,
                {
                    id: 20,
                    nom: 'Chaufferie de Bordeaux',
                    commune: { com: '33063', libelle: 'Bordeaux', dep: '33' },
                },
            ],
            [nouvelleAquitaine]
        )

        expect(regions.get(saintJunien.id)).toBe('Nouvelle-Aquitaine')
        expect(regions.get(bordeaux.id)).toBe('Nouvelle-Aquitaine')
    })
})
