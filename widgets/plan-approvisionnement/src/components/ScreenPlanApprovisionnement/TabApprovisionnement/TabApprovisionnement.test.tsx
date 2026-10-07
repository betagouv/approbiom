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
import TabApprovisionnement from './TabApprovisionnement'

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

// Null for an approvisionnement without fournisseur.
function approvisionnement(
    id: number,
    dep: string,
    fournisseur: string | null = '00000000000001'
): Approvisionnement {
    return {
        id,
        planDApprovisionnement: 1,
        fournisseur: fournisseur ?? undefined,
        ressource: '1A-PFA',
        provenance: { source: DEPARTEMENT_FRANCAIS, code: dep },
        tonnageTotal: 1200.5,
    }
}

function renderTab(
    approvisionnements: readonly Approvisionnement[],
    hasAttachments = true
) {
    render(
        <TabApprovisionnement
            approvisionnements={approvisionnements}
            hasAttachments={hasAttachments}
            {...REFERENTIELS}
        />
    )
}

// The header row comes first.
const bodyRows = () => screen.getAllByRole('row').slice(1)

afterEach(cleanup)

describe('TabApprovisionnement', () => {
    it('shows each approvisionnement in a named table', () => {
        renderTab([approvisionnement(1, '19')])

        expect(
            screen.getByRole('table', { name: 'Approvisionnements du plan' })
        ).toBeTruthy()
        // Intl separates thousands with a narrow no-break space.
        expect(
            within(bodyRows()[0])
                .getAllByRole('cell')
                .map((cell) => cell.textContent.replace(/\s/g, ' '))
        ).toEqual([
            'Pas de doublon',
            'BOIS FICTIF ENERGIE',
            '1A-PFA · Plaquettes forestières',
            'Corrèze (19)',
            '1 200,5',
        ])
    })

    it('says when the plan does not give the fournisseur', () => {
        renderTab([approvisionnement(1, '19', null)])

        expect(screen.getByText('Non renseigné')).toBeTruthy()
    })

    it('says nothing of duplicates when there are none', () => {
        renderTab([approvisionnement(1, '19'), approvisionnement(2, '87')])

        expect(screen.queryByText(/à corriger/)).toBeNull()
    })

    it('counts the groups of duplicates', () => {
        renderTab([
            approvisionnement(1, '19'),
            approvisionnement(2, '19'),
            approvisionnement(3, '87', null),
            approvisionnement(4, '87', null),
        ])

        expect(screen.getByText('2 doublons à corriger')).toBeTruthy()
        expect(screen.getAllByText('Doublon A')).toHaveLength(2)
        expect(screen.getAllByText('Doublon B')).toHaveLength(2)
    })

    it('shows only the duplicates, then every row again', () => {
        renderTab([
            approvisionnement(1, '19'),
            approvisionnement(2, '19'),
            approvisionnement(3, '87'),
        ])

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Afficher uniquement les doublons',
            })
        )
        expect(bodyRows()).toHaveLength(2)

        fireEvent.click(
            screen.getByRole('button', { name: 'Afficher toutes les lignes' })
        )
        expect(bodyRows()).toHaveLength(3)
    })

    it('offers the document when the plan has an attachment', () => {
        renderTab([])

        expect(
            screen.getByText('Aucun approvisionnement pour ce plan')
        ).toBeTruthy()
        expect(
            screen.getByText(/document BCIB\/BCIAT joint au plan/)
        ).toBeTruthy()
    })

    it('says why the document cannot be used without an attachment', () => {
        renderTab([], false)

        expect(
            screen.getByText(/Aucune pièce jointe n'est liée à ce plan/)
        ).toBeTruthy()
    })
})
