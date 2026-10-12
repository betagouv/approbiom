import type { DepartementsByRegion } from '@shared/core/application/ports/referentiel-geo'

export const FAKE_DEPARTEMENTS_BY_REGION: readonly DepartementsByRegion[] = [
    {
        region: { reg: '75', libelle: 'Nouvelle-Aquitaine' },
        departements: [
            { dep: '19', libelle: 'Corrèze' },
            { dep: '23', libelle: 'Creuse' },
            { dep: '24', libelle: 'Dordogne' },
            { dep: '86', libelle: 'Vienne' },
            { dep: '87', libelle: 'Haute-Vienne' },
        ],
    },
    {
        region: { reg: '84', libelle: 'Auvergne-Rhône-Alpes' },
        departements: [
            { dep: '15', libelle: 'Cantal' },
            { dep: '63', libelle: 'Puy-de-Dôme' },
        ],
    },
]
