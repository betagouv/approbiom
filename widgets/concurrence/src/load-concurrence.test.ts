import { describe, expect, it, vi } from 'vitest'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { PlanDApprovisionnement } from '@shared/core/domain/entities/plan-d-approvisionnement'
import { DEPARTEMENT_FRANCAIS } from '@shared/core/domain/value-objects/provenance'
import { loadConcurrence, type ConcurrencePorts } from './load-concurrence'

const approvisionnement: Approvisionnement = {
    id: 1,
    planDApprovisionnement: 7,
    ressource: '2B-CIB',
    provenance: { source: DEPARTEMENT_FRANCAIS, code: '17' },
    tonnageTotal: 300,
}

const plan = {
    id: 7,
    nom: 'Chaufferie fictive - création - projet',
    installation: 3,
    typeDePlan: 'création',
    statut: 'projet',
} as PlanDApprovisionnement

const listRessources = vi.fn(() =>
    Promise.resolve([
        {
            code: '2B-CIB',
            title: 'Connexes de scierie',
            famille: '2 Coproduits 1ère transfo Bois',
        },
    ])
)

/** Only what loadConcurrence reads; the other port methods are never called. */
function ports(
    totals: { planDApprovisionnement: number; ressource: string }[]
): ConcurrencePorts {
    return {
        approvisionnements: {
            listGroupedByPlanAndRessource: () =>
                Promise.resolve(
                    totals.map((total) => ({
                        ...total,
                        tonnageTotal: 300,
                        repartition: 1,
                    }))
                ),
            list: () => Promise.resolve([approvisionnement]),
        },
        plans: { list: () => Promise.resolve([plan]) },
        installations: {
            list: () =>
                Promise.resolve([
                    { id: 3, nom: 'Chaufferie fictive', commune: '17300' },
                ]),
        },
        ressources: { list: listRessources },
        entreprises: { list: () => Promise.resolve([]) },
        referentielGeo: {
            listDepartementsByRegion: () =>
                Promise.resolve([
                    {
                        region: { reg: '75', libelle: 'Nouvelle-Aquitaine' },
                        departements: [
                            { dep: '17', libelle: 'Charente-Maritime' },
                        ],
                    },
                ]),
            getCommuneCenterPosition: () => undefined,
            getDepartementContour: () => [],
            getCountryContour: () => [],
        },
    } as unknown as ConcurrencePorts
}

describe('loadConcurrence', () => {
    it('keys each row by its plan id, with its installation, type, ressource code and famille', async () => {
        const { approvisionnementsByPlanAndRessource } = await loadConcurrence(
            ports([{ planDApprovisionnement: 7, ressource: '2B-CIB' }])
        )

        expect(approvisionnementsByPlanAndRessource).toEqual([
            {
                plan: {
                    id: 7,
                    installationNom: 'Chaufferie fictive',
                    typeDePlan: 'création',
                    departementDeSituation: 'Charente-Maritime',
                    installationCommune: '17300',
                    statut: 'projet',
                },
                ressource: 'Connexes de scierie',
                ressourceCode: '2B-CIB',
                ressourceFamille: '2 Coproduits 1ère transfo Bois',
                approvisionnements: [approvisionnement],
                tonnageTotal: 300,
            },
        ])
    })

    it('keeps the plan id and the code of what the référentiels do not hold', async () => {
        const [row] = (
            await loadConcurrence(
                ports([{ planDApprovisionnement: 99, ressource: 'XX' }])
            )
        ).approvisionnementsByPlanAndRessource

        expect(row).toMatchObject({
            plan: { id: 99, installationNom: '', typeDePlan: '' },
            ressource: 'XX',
            ressourceCode: 'XX',
            ressourceFamille: '',
        })
    })

    it('asks only for the ressource properties it shows', async () => {
        await loadConcurrence(ports([]))

        expect(listRessources).toHaveBeenCalledWith([
            'code',
            'title',
            'famille',
        ])
    })
})
