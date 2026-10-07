import { describe, expect, it } from 'vitest'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import {
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
} from '@shared/core/domain/value-objects/provenance'
import {
    NO_FOURNISSEUR,
    parseTonnage,
    toEditableFields,
    toForm,
} from './approvisionnement-form'

const APPROVISIONNEMENT: Approvisionnement = {
    id: 4,
    planDApprovisionnement: 1,
    fournisseur: '00000000000002',
    ressource: '1A-PFA',
    provenance: { source: DEPARTEMENT_FRANCAIS, code: '19' },
    tonnageTotal: 1200.5,
}

describe('parseTonnage', () => {
    it.each([
        ['1200', 1200],
        ['1 200,5', 1200.5],
        ['1200.5', 1200.5],
        [' 0,25 ', 0.25],
    ])('reads « %s »', (text, tonnage) => {
        expect(parseTonnage(text)).toBe(tonnage)
    })

    it.each(['', '0', '-3', 'abc', '1,2,3'])('refuses « %s »', (text) => {
        expect(parseTonnage(text)).toBeNull()
    })
})

describe('toForm', () => {
    it('fills the fields with the approvisionnement', () => {
        expect(toForm(APPROVISIONNEMENT)).toEqual({
            fournisseur: '00000000000002',
            ressource: '1A-PFA',
            provenance: 'Département français|19',
            tonnage: '1200,5',
        })
    })

    it('chooses « Non renseigné » for a fournisseur left out', () => {
        expect(
            toForm({ ...APPROVISIONNEMENT, fournisseur: undefined }).fournisseur
        ).toBe(NO_FOURNISSEUR)
    })

    it('leaves a blank département to be chosen again', () => {
        expect(
            toForm({
                ...APPROVISIONNEMENT,
                provenance: { source: DEPARTEMENT_FRANCAIS, code: '' },
            }).provenance
        ).toBeNull()
    })
})

describe('toEditableFields', () => {
    it('gives back what the form was filled with', () => {
        const { fournisseur, ressource, provenance, tonnageTotal } =
            APPROVISIONNEMENT

        expect(toEditableFields(toForm(APPROVISIONNEMENT))).toEqual({
            fournisseur,
            ressource,
            provenance,
            tonnageTotal,
        })
    })

    it('reads a country back as a country', () => {
        expect(
            toEditableFields({
                ...toForm(APPROVISIONNEMENT),
                provenance: 'Pays étranger|Espagne',
            })?.provenance
        ).toEqual({ source: PAYS_ETRANGER, libelle: 'Espagne' })
    })

    it('writes « Non renseigné » as no fournisseur', () => {
        expect(
            toEditableFields({
                ...toForm(APPROVISIONNEMENT),
                fournisseur: NO_FOURNISSEUR,
            })
        ).toHaveProperty('fournisseur', undefined)
    })

    it.each([
        ['fournisseur', null],
        ['ressource', null],
        ['provenance', null],
        ['tonnage', '0'],
    ])('cannot be saved without a %s', (field, value) => {
        expect(
            toEditableFields({ ...toForm(APPROVISIONNEMENT), [field]: value })
        ).toBeNull()
    })
})
