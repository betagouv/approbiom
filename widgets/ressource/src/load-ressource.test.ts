import { describe, expect, it } from 'vitest'
import { loadRessource, type RessourcePorts } from './load-ressource'

/** A port method that just hands back what it was given. */
const rows =
    <T>(value: readonly T[]) =>
    () =>
        Promise.resolve(value)

// The ports are small interfaces, so the fakes are object literals: no Grist,
// no mocking framework, nothing to keep in step with an adapter.
function fakePorts(overrides: Partial<RessourcePorts> = {}): RessourcePorts {
    return {
        approvisionnements: {
            listApprovisionnements: rows([]),
            listByPlanAndRessource: rows([]),
            listByPlanRessourceAndRegion: rows([]),
            listByPlanRessourceAndFournisseur: rows([]),
            listByPlanRessourceAndDepartementDeProvenance: rows([]),
        },
        plans: { list: rows([]) },
        ressources: { list: rows([]) },
        entreprises: { list: rows([]) },
        insee: { listDepartementsByRegion: rows([]) },
        ...overrides,
    }
}

describe('loadRessource', () => {
    it('hands each aggregate through under its own name', async () => {
        const total = { planDApprovisionnement: 1, ressource: 'PF' }
        const region = { ...total, region: 'Nouvelle-Aquitaine' }
        const fournisseur = { ...total, fournisseur: '123' }
        const departement = { ...total, departementDeProvenance: '33' }

        const screen = await loadRessource(
            fakePorts({
                approvisionnements: {
                    listApprovisionnements: rows([]),
                    listByPlanAndRessource: rows([total]),
                    listByPlanRessourceAndRegion: rows([region]),
                    listByPlanRessourceAndFournisseur: rows([fournisseur]),
                    listByPlanRessourceAndDepartementDeProvenance: rows([
                        departement,
                    ]),
                },
            })
        )

        expect(screen.totals).toEqual([total])
        expect(screen.byRegion).toEqual([region])
        expect(screen.byFournisseur).toEqual([fournisseur])
        expect(screen.byDepartementDeProvenance).toEqual([departement])
    })

    it('lists every plan, including one with no approvisionnement', async () => {
        const screen = await loadRessource(
            fakePorts({
                plans: {
                    list: rows([
                        { id: 1, nom: 'Plan Nord', installation: 10 },
                        { id: 2, nom: 'Plan Sans Ressource', installation: 20 },
                    ]),
                },
            })
        )

        expect(screen.plans.map((plan) => plan.nom)).toEqual([
            'Plan Nord',
            'Plan Sans Ressource',
        ])
    })

    it('indexes ressource titles by the code the aggregates carry', async () => {
        const screen = await loadRessource(
            fakePorts({
                ressources: {
                    list: rows([
                        { code: 'PF', title: 'Plaquettes forestières' },
                        { code: 'EC', title: 'Écorces' },
                    ]),
                },
            })
        )

        expect(screen.ressourceTitles.get('PF')).toBe('Plaquettes forestières')
        expect(screen.ressourceTitles.get('EC')).toBe('Écorces')
    })

    it('indexes fournisseur names by siret', async () => {
        const screen = await loadRessource(
            fakePorts({
                entreprises: {
                    list: rows([
                        {
                            siret: '12345678900011',
                            denomination: 'Scierie Sud',
                        },
                    ]),
                },
            })
        )

        expect(screen.fournisseurNames.get('12345678900011')).toBe(
            'Scierie Sud'
        )
    })

    it('flattens the référentiel into one département directory', async () => {
        const screen = await loadRessource(
            fakePorts({
                insee: {
                    listDepartementsByRegion: rows([
                        {
                            region: {
                                reg: '75',
                                libelle: 'Nouvelle-Aquitaine',
                            },
                            departements: [
                                { dep: '33', libelle: 'Gironde' },
                                { dep: '16', libelle: 'Charente' },
                            ],
                        },
                        {
                            region: { reg: '76', libelle: 'Occitanie' },
                            departements: [
                                { dep: '31', libelle: 'Haute-Garonne' },
                            ],
                        },
                    ]),
                },
            })
        )

        // Départements from every région land in the same map, so a code read
        // off an aggregate is named without knowing which région it sits in.
        expect(screen.departementNames.get('33')).toBe('Gironde')
        expect(screen.departementNames.get('16')).toBe('Charente')
        expect(screen.departementNames.get('31')).toBe('Haute-Garonne')
    })

    it('does not let an entreprise with no siret shadow a real one', async () => {
        const screen = await loadRessource(
            fakePorts({
                entreprises: {
                    list: rows([
                        { siret: '', denomination: 'Sans SIRET' },
                        { siret: '999', denomination: 'Avec SIRET' },
                    ]),
                },
            })
        )

        // An unresolvable fournisseur reads as the empty key, so it must not
        // take over the entry a real siret needs.
        expect(screen.fournisseurNames.get('999')).toBe('Avec SIRET')
        expect(screen.fournisseurNames.size).toBe(2)
    })
})
