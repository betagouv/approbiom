import { describe, expect, it } from 'vitest'
import type { Plan_d_approvisionnement } from '@shared/grist/approbiom/tables'
import { getFilteredRows } from './utils'

function planWith(
    row: Partial<Plan_d_approvisionnement>
): Plan_d_approvisionnement {
    return {
        Nom: 'Plan',
        Statut: 'projet',
        Departement_de_situation: 'Poitiers (86)',
        Appel_a_projet: 'CHALEUR+ (2024)',
        Type_de_plan: 'création',
        Usage_principal: 'énergie',
        Mise_en_service_projet: '2025',
        Nature_Donnee: 'prévision',
        id_pa: 1,
        Installation: 1,
        Installation_Nom: 'Plan',
        Mise_en_service_Projet_raw: null,
        MES_Reel: null,
        Derniere_mise_a_jour: null,
        Commentaire: '',
        deprecie_Synthese: '',
        est_Filtre_Dans_Accueil: null,
        Ouvrir_la_fiche: null,
        ...row,
    }
}

const valFleuri = planWith({
    id_pa: 1,
    Nom: 'RCU Val-Fleuri 1',
    Statut: 'projet',
    Departement_de_situation: 'Poitiers (86)',
    Appel_a_projet: 'CHALEUR+ (2024)',
})
const belOrme = planWith({
    id_pa: 2,
    Nom: 'Chaufferie de Bel-Orme',
    Statut: 'abandonné',
    Departement_de_situation: 'Guéret (23)',
    Appel_a_projet: 'GRANULÉS NA (2023)',
})
const plaineSud = planWith({
    id_pa: 3,
    Nom: 'PLAINE-SUD phase 1',
    Statut: 'projet',
    Departement_de_situation: 'Poitiers (86)',
    Appel_a_projet: '',
})

const plans: readonly Plan_d_approvisionnement[] = [
    valFleuri,
    belOrme,
    plaineSud,
]

describe('getFilteredRows', () => {
    describe('on nom', () => {
        it('keeps the rows whose name contains the query', () => {
            expect(getFilteredRows(plans, { nom: 'Bel-Orme' })).toEqual([
                belOrme,
            ])
        })

        it('matches anywhere in the name, not only at its start', () => {
            expect(getFilteredRows(plans, { nom: 'Val-Fleuri' })).toEqual([
                valFleuri,
            ])
        })

        it('ignores case on the query', () => {
            expect(getFilteredRows(plans, { nom: 'rcu' })).toEqual([valFleuri])
        })

        it('ignores case on the name', () => {
            expect(getFilteredRows(plans, { nom: 'Phase' })).toEqual([
                plaineSud,
            ])
        })

        it('ignores the spaces around the query', () => {
            expect(getFilteredRows(plans, { nom: '  Bel-Orme  ' })).toEqual([
                belOrme,
            ])
        })

        it('returns nothing when no name matches', () => {
            expect(getFilteredRows(plans, { nom: 'Bioraffinerie' })).toEqual([])
        })

        it('keeps the rows in the order they were given', () => {
            // '1' is in the first and the last name, not in the middle one, so
            // a result that came back reordered would show up here.
            expect(getFilteredRows(plans, { nom: '1' })).toEqual([
                valFleuri,
                plaineSud,
            ])
        })
    })

    describe('on statuts', () => {
        it('keeps the rows carrying the selected statut', () => {
            expect(getFilteredRows(plans, { statuts: ['abandonné'] })).toEqual([
                belOrme,
            ])
        })

        it('keeps the rows carrying any of several statuts, in order', () => {
            expect(
                getFilteredRows(plans, { statuts: ['abandonné', 'projet'] })
            ).toEqual([valFleuri, belOrme, plaineSud])
        })

        it('returns nothing when no row carries the selected statut', () => {
            expect(getFilteredRows(plans, { statuts: ['obsolète'] })).toEqual(
                []
            )
        })
    })

    describe('on appelsAProjet', () => {
        it('keeps the rows attached to the selected call', () => {
            expect(
                getFilteredRows(plans, {
                    appelsAProjet: ['GRANULÉS NA (2023)'],
                })
            ).toEqual([belOrme])
        })

        it('keeps the rows attached to any of several calls, in order', () => {
            expect(
                getFilteredRows(plans, {
                    appelsAProjet: ['GRANULÉS NA (2023)', 'CHALEUR+ (2024)'],
                })
            ).toEqual([valFleuri, belOrme])
        })

        it('selects the rows attached to no call at all', () => {
            expect(getFilteredRows(plans, { appelsAProjet: [''] })).toEqual([
                plaineSud,
            ])
        })
    })

    describe('on lieux', () => {
        it('keeps the rows situated in the selected commune', () => {
            expect(getFilteredRows(plans, { lieux: ['Guéret (23)'] })).toEqual([
                belOrme,
            ])
        })

        it('keeps the rows of several communes, in order', () => {
            expect(
                getFilteredRows(plans, {
                    lieux: ['Poitiers (86)', 'Guéret (23)'],
                })
            ).toEqual([valFleuri, belOrme, plaineSud])
        })

        it('returns nothing when no row is situated there', () => {
            expect(getFilteredRows(plans, { lieux: ['Lacq (64)'] })).toEqual([])
        })
    })

    describe('with nothing to filter on', () => {
        it('returns every row when no criterion is given', () => {
            expect(getFilteredRows(plans)).toEqual(plans)
        })

        it('returns every row when the search is cleared', () => {
            expect(getFilteredRows(plans, { nom: '' })).toEqual(plans)
        })

        it('returns every row when no statut is selected', () => {
            expect(getFilteredRows(plans, { statuts: [] })).toEqual(plans)
        })

        it('returns every row once every criterion is cleared', () => {
            // What the reset button leaves behind.
            expect(
                getFilteredRows(plans, {
                    nom: '',
                    statuts: [],
                    lieux: [],
                    appelsAProjet: [],
                })
            ).toEqual(plans)
        })
    })

    describe('with several criteria', () => {
        it('keeps only the rows matching all of them', () => {
            // 'i' is in all three names; the statut is what narrows it down.
            expect(
                getFilteredRows(plans, { nom: 'i', statuts: ['projet'] })
            ).toEqual([valFleuri, plaineSud])
        })

        it('returns nothing when no row matches both', () => {
            expect(
                getFilteredRows(plans, {
                    nom: 'Bel-Orme',
                    statuts: ['projet'],
                })
            ).toEqual([])
        })
    })

    it('hands back the very rows it was given', () => {
        expect(getFilteredRows(plans, { nom: 'rcu' })[0]).toBe(valFleuri)
    })

    it('leaves the rows it was given untouched', () => {
        const rows = [valFleuri, belOrme, plaineSud]

        getFilteredRows(rows, { nom: 'rcu', statuts: ['projet'] })

        expect(rows).toEqual([valFleuri, belOrme, plaineSud])
    })
})
