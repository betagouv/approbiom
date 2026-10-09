import { afterEach, describe, expect, it } from 'vitest'
import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import { DEPARTEMENT_FRANCAIS } from '@shared/core/domain/value-objects/provenance'
import TabSynthese from './TabSynthese'

const REFERENTIELS = {
    entreprises: [
        { siret: '00000000000001', denomination: 'BOIS FICTIF ENERGIE' },
    ],
    ressources: [
        {
            code: '1A-PFA',
            ademeCode: '2017-1A-PFA',
            title: 'Plaquettes forestières',
            description: 'Plaquettes forestières dont souches et rémanents',
        },
        {
            code: '2B-CIB',
            ademeCode: '2017-2B-CIB',
            title: 'Connexes de scierie',
            description: 'Produits connexes de scierie hors écorces',
        },
    ],
    departementsByRegion: [
        {
            region: { reg: '75', libelle: 'Nouvelle-Aquitaine' },
            departements: [
                { dep: '19', libelle: 'Corrèze' },
                { dep: '87', libelle: 'Haute-Vienne' },
            ],
        },
    ],
}

let nextId = 1
const approvisionnement = (
    ressource: string,
    dep: string,
    tonnageTotal: number,
    fournisseur: string | null = '00000000000001'
): Approvisionnement => ({
    id: nextId++,
    planDApprovisionnement: 1,
    fournisseur: fournisseur ?? undefined,
    ressource,
    provenance: { source: DEPARTEMENT_FRANCAIS, code: dep },
    tonnageTotal,
})

const PLAN = [
    approvisionnement('1A-PFA', '19', 600),
    approvisionnement('1A-PFA', '87', 200, null),
    approvisionnement('2B-CIB', '19', 200),
]

function renderTab(approvisionnements: readonly Approvisionnement[] = PLAN) {
    render(
        <TabSynthese
            approvisionnements={approvisionnements}
            hasAttachments
            {...REFERENTIELS}
        />
    )
}

const linesOf = (title: string) =>
    within(screen.getByRole('region', { name: title }))
        .getAllByRole('listitem')
        .map((item) =>
            [...item.children]
                .map((cell) => cell.textContent.replace(/\s/g, ' '))
                .filter(Boolean)
                .join(' | ')
        )

afterEach(cleanup)

describe('TabSynthese', () => {
    it('shares the tonnage out by provenance, heaviest first', () => {
        renderTab()

        expect(linesOf('Par provenance')).toEqual([
            'Corrèze (19) | 800 t MV/an | 80 %',
            'Haute-Vienne (87) | 200 t MV/an | 20 %',
            'Total | 1 000 t MV/an | 100 %',
        ])
    })

    it('shares the tonnage out by fournisseur', () => {
        renderTab()

        expect(linesOf('Par fournisseur')).toEqual([
            'BOIS FICTIF ENERGIE | 800 t MV/an | 80 %',
            'Non renseigné | 200 t MV/an | 20 %',
            'Total | 1 000 t MV/an | 100 %',
        ])
    })

    it('offers only the ressources of the plan', () => {
        renderTab()

        expect(
            within(screen.getByRole('group', { name: /Filtrer/ }))
                .getAllByRole('button')
                .map((tag) => tag.textContent)
        ).toEqual(['1A-PFA', '2B-CIB'])
    })

    it('keeps to the ressources chosen, then to all of them again', () => {
        renderTab()

        fireEvent.click(screen.getByRole('button', { name: '2B-CIB' }))
        expect(linesOf('Par provenance')).toEqual([
            'Corrèze (19) | 200 t MV/an | 100 %',
            'Total | 200 t MV/an | 100 %',
        ])

        fireEvent.click(
            screen.getByRole('button', { name: 'Toutes les ressources' })
        )
        expect(
            screen.getByRole('button', { name: '2B-CIB', pressed: false })
        ).toBeTruthy()
        expect(linesOf('Par provenance')).toHaveLength(3)
    })

    it('offers no filter for a single ressource', () => {
        renderTab([approvisionnement('1A-PFA', '19', 600)])

        expect(screen.queryByRole('group', { name: /Filtrer/ })).toBeNull()
    })

    it('says when the plan has no approvisionnement', () => {
        renderTab([])

        expect(
            screen.getByText('Aucun approvisionnement pour ce plan')
        ).toBeTruthy()
    })
})
