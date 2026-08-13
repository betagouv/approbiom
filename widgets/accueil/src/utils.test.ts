import { describe, expect, it } from 'vitest'
import type {
    DemandeSubventionAccueil,
    PlanAccueil,
} from '@shared/application/read-models/plan-accueil'
import {
    getDepartementOptions,
    getFilteredRows,
    getStatutOptions,
} from './utils'

function plan(overrides: Partial<PlanAccueil> = {}): PlanAccueil {
    return {
        id: 1,
        nom: 'Plan',
        installation: 1,
        typeDePlan: 'création',
        usage: 'énergie',
        natureDonnee: 'prévision',
        statut: 'projet',
        departement: null,
        installationRegion: null,
        demandesSubvention: [],
        ...overrides,
    }
}

let demandeId = 0

function demande(appelAProjet: string): DemandeSubventionAccueil {
    demandeId += 1

    return {
        id: demandeId,
        programmeAide: {
            id: demandeId,
            year: 2023,
            name: `Programme ${appelAProjet}`,
            shortName: appelAProjet,
            appelAProjet,
        },
        instructions: [],
    }
}

const valFleuri = plan({
    id: 1,
    nom: 'RCU Val Fleuri',
    statut: 'projet',
    departement: '87',
    installationRegion: 'Nouvelle-Aquitaine',
    demandesSubvention: [demande('BCIAT (2023)')],
})
const boisDuNord = plan({
    id: 2,
    nom: 'Chaufferie Bois du Nord',
    statut: 'en fonctionnement',
    departement: '33',
    installationRegion: 'Nouvelle-Aquitaine',
    demandesSubvention: [demande('BCIAT (2023)'), demande('BCIB (2024)')],
})
const clairVillage = plan({
    id: 3,
    nom: 'RCU Clair-Village',
    statut: 'obsolète',
})

const plans = [valFleuri, boisDuNord, clairVillage]

describe('getFilteredRows', () => {
    it('returns every row when nothing is asked of it', () => {
        expect(getFilteredRows(plans)).toEqual(plans)
        expect(getFilteredRows(plans, {})).toEqual(plans)
        expect(getFilteredRows(plans, { nom: '', statuts: [] })).toEqual(plans)
    })

    it('matches a name anywhere in it, whatever the case', () => {
        expect(getFilteredRows(plans, { nom: 'rcu' })).toEqual([
            valFleuri,
            clairVillage,
        ])
        expect(getFilteredRows(plans, { nom: 'BOIS' })).toEqual([boisDuNord])
    })

    it('trims the query before matching', () => {
        expect(getFilteredRows(plans, { nom: '  val fleuri  ' })).toEqual([
            valFleuri,
        ])
    })

    it('returns nothing when no name matches', () => {
        expect(getFilteredRows(plans, { nom: 'introuvable' })).toEqual([])
    })

    it('keeps the rows in the order they were given', () => {
        expect(
            getFilteredRows(plans, { statuts: ['obsolète', 'projet'] })
        ).toEqual([valFleuri, clairVillage])
    })

    it('hands back the very rows it was given, not copies', () => {
        // The table renders these objects, so identity has to survive filtering.
        expect(getFilteredRows(plans, { nom: 'val' })[0]).toBe(valFleuri)
    })

    it('does not touch the array it was given', () => {
        const given = [...plans]
        getFilteredRows(plans, { nom: 'rcu', statuts: ['projet'] })
        expect(plans).toEqual(given)
    })

    it('keeps the plans sitting in a département that was picked', () => {
        expect(getFilteredRows(plans, { departements: ['87'] })).toEqual([
            valFleuri,
        ])
        expect(getFilteredRows(plans, { departements: ['87', '33'] })).toEqual([
            valFleuri,
            boisDuNord,
        ])
    })

    it('leaves out a plan that sits nowhere, once a département is picked', () => {
        // Clair-Village has no département to match, so it is out — the same
        // answer as for a plan sitting somewhere that was not picked.
        expect(getFilteredRows(plans, { departements: ['33'] })).toEqual([
            boisDuNord,
        ])
    })

    it('keeps every plan while no département is picked, placed or not', () => {
        expect(getFilteredRows(plans, {})).toEqual(plans)
    })

    it('narrows on every criterion at once', () => {
        expect(
            getFilteredRows(plans, { nom: 'rcu', statuts: ['projet'] })
        ).toEqual([valFleuri])
        // Each one matches something, but no row matches both.
        expect(
            getFilteredRows(plans, { nom: 'bois', statuts: ['projet'] })
        ).toEqual([])
    })
})

describe('getDepartementOptions', () => {
    it('groups the départements under their région, régions sorted in French', () => {
        expect(
            getDepartementOptions([
                {
                    region: { reg: '75', libelle: 'Nouvelle-Aquitaine' },
                    departements: [
                        { dep: '87', libelle: 'Haute-Vienne' },
                        { dep: '33', libelle: 'Gironde' },
                    ],
                },
                {
                    // Under I, where a reader looks for it — not after Z.
                    region: { reg: '11', libelle: 'Île-de-France' },
                    departements: [{ dep: '75', libelle: 'Paris' }],
                },
            ])
        ).toEqual([
            {
                id: '11',
                label: 'Île-de-France',
                options: [{ value: '75', label: '75' }],
            },
            {
                id: '75',
                label: 'Nouvelle-Aquitaine',
                options: [
                    { value: '87', label: '87' },
                    { value: '33', label: '33' },
                ],
            },
        ])
    })

    it('does not reorder the array it was given', () => {
        const given = [
            {
                region: { reg: '75', libelle: 'Nouvelle-Aquitaine' },
                departements: [],
            },
            {
                region: { reg: '11', libelle: 'Île-de-France' },
                departements: [],
            },
        ]
        getDepartementOptions(given)

        expect(given[0].region.libelle).toBe('Nouvelle-Aquitaine')
    })
})

describe('getStatutOptions', () => {
    it('offers each statut once, capitalised and in alphabetical order', () => {
        expect(getStatutOptions([...plans, plan({ id: 4 })])).toEqual([
            { value: 'en fonctionnement', label: 'En fonctionnement' },
            { value: 'obsolète', label: 'Obsolète' },
            { value: 'projet', label: 'Projet' },
        ])
    })

    it('drops a statut the document left empty', () => {
        // An option with no label is a checkbox nobody can read.
        expect(getStatutOptions([plan({ statut: '' })])).toEqual([])
    })
})
