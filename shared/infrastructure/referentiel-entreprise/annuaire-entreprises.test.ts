import { describe, expect, it } from 'vitest'
import {
    annuaireEntrepriseUrl,
    annuaireSearchUrl,
} from './annuaire-entreprises'

// Addresses the Annuaire des Entreprises itself redirects to, read from the
// site for entreprises of the Entreprise table.
describe('annuaireEntrepriseUrl', () => {
    it.each([
        [
            'PONTY COMPOST ENVIRONNEMENT',
            '49523420500021',
            'ponty-compost-environnement-495234205',
        ],
        [
            'BOIS NEGOCE ENERGIE (BNE) (BNE)',
            '45156382900030',
            'bois-negoce-energie-bne-bne-451563829',
        ],
        [
            'GROUPE DP BOIS & ENERGIE (DP BOIS)',
            '51526141000028',
            'groupe-dp-bois-energie-dp-bois-515261410',
        ],
        [
            'SARL LEJEUNE (GARAGE ST PIERRE)',
            '88836875000012',
            'sarl-lejeune-garage-st-pierre-888368750',
        ],
        ["SAUL'BOIS ENERGIE", '50783607000015', 'saul-bois-energie-507836070'],
        ['AFB (AFB)', '95130431000018', 'afb-afb-951304310'],
    ])('links « %s » to its page', (denomination, siret, page) => {
        expect(annuaireEntrepriseUrl({ denomination, siret })).toBe(
            `https://annuaire-entreprises.data.gouv.fr/entreprise/${page}`
        )
    })

    it('leaves the accents out', () => {
        expect(
            annuaireEntrepriseUrl({
                denomination: 'OFFICE NATIONAL DES FORÊTS (ONF)',
                siret: '66204311600019',
            })
        ).toBe(
            'https://annuaire-entreprises.data.gouv.fr/entreprise/office-national-des-forets-onf-662043116'
        )
    })
})

describe('annuaireSearchUrl', () => {
    it('searches the terms on the Annuaire des Entreprises', () => {
        expect(annuaireSearchUrl('scierie introuvable')).toBe(
            'https://annuaire-entreprises.data.gouv.fr/rechercher?terme=scierie+introuvable'
        )
    })
})
