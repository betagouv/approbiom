import { describe, expect, it } from 'vitest'
import type { Plan } from '@shared/application/read-models/plan'
import { getFilteredRows, getStatutOptions } from './utils'

function plan(overrides: Partial<Plan> = {}): Plan {
    return {
        id: 1,
        nom: 'Plan',
        installation: 1,
        typeDePlan: 'création',
        usage: 'énergie',
        natureDonnee: 'prévision',
        statut: 'projet',
        ...overrides,
    }
}

const valFleuri = plan({ id: 1, nom: 'RCU Val Fleuri', statut: 'projet' })
const boisDuNord = plan({
    id: 2,
    nom: 'Chaufferie Bois du Nord',
    statut: 'en fonctionnement',
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
