import { describe, expect, it } from 'vitest'
import { toRessource } from './grist-adapter-ressource'

describe('toRessource', () => {
    it('reads the famille from the « Famille ressource » column', () => {
        expect(
            toRessource({
                id: 1,
                Code_ressource_Approbiom: '2B-CIB',
                ademe_2017: '2017-2B-CIB',
                Description_courte: 'Connexes de scierie',
                Description: 'Produits connexes de scierie hors écorces',
                Famille_ressource: '2 Coproduits 1ère transfo Bois',
            })
        ).toEqual({
            code: '2B-CIB',
            ademeCode: '2017-2B-CIB',
            title: 'Connexes de scierie',
            famille: '2 Coproduits 1ère transfo Bois',
            description: 'Produits connexes de scierie hors écorces',
        })
    })

    it('leaves the famille empty when the cell is', () => {
        expect(toRessource({ id: 1, Famille_ressource: null }).famille).toBe('')
    })
})
