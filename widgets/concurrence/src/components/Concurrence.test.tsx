import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { DepartementsByRegion } from '@shared/core/application/ports/insee'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import {
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
} from '@shared/core/domain/value-objects/provenance'
import Concurrence from './Concurrence'
import type { ConcurrenceRow } from '../load-concurrence'

const scieriePicard: Entreprise = {
    siret: '11111111111111',
    denomination: 'Scierie Picard',
}

const forstGmbh: Entreprise = {
    siret: '22222222222222',
    denomination: 'Forst GmbH',
}

const nouvelleAquitaine: DepartementsByRegion = {
    region: { reg: '75', libelle: 'Nouvelle-Aquitaine' },
    departements: [
        { dep: '87', libelle: 'Haute-Vienne' },
        { dep: '24', libelle: 'Dordogne' },
    ],
}

const deHauteVienne: Approvisionnement = {
    planDApprovisionnement: 1,
    ressource: 'Plaquettes forestières',
    provenance: { source: DEPARTEMENT_FRANCAIS, code: '87' },
    fournisseur: scieriePicard.siret,
    tonnageTotal: 120,
}

const dAllemagne: Approvisionnement = {
    planDApprovisionnement: 1,
    ressource: 'Plaquettes forestières',
    provenance: { source: PAYS_ETRANGER, libelle: 'Allemagne' },
    fournisseur: forstGmbh.siret,
    tonnageTotal: 80,
}

const saintJunien: ConcurrenceRow = {
    planDApprovisionnement: 'RC Saint Junien',
    ressource: 'Plaquettes forestières',
    departementDeSituation: 'Haute-Vienne',
    approvisionnements: [deHauteVienne, dAllemagne],
    tonnageTotal: 200,
}

function renderConcurrence(rows: readonly ConcurrenceRow[] = [saintJunien]) {
    return render(
        <Concurrence
            approvisionnementsByPlanAndRessource={rows}
            departementsByRegion={[nouvelleAquitaine]}
            fournisseurs={[scieriePicard, forstGmbh]}
        />
    )
}

/** The one data row on screen, whatever the filters left of it. */
const planRow = () =>
    within(screen.getByRole('table')).getByRole('row', {
        name: /RC Saint Junien/,
    })

const openProvenanceFilter = () =>
    fireEvent.click(screen.getByRole('button', { name: /Provenance/ }))

const check = (name: string) =>
    fireEvent.click(screen.getByRole('checkbox', { name }))

afterEach(() => {
    cleanup()
})

describe('Concurrence', () => {
    it('shows both kinds of provenance in the same cell', () => {
        renderConcurrence()

        expect(within(planRow()).getAllByRole('cell')[2].textContent).toBe(
            '87, Allemagne'
        )
    })

    // Départements keep their régions, which is what the référentiel is read
    // for; the countries hang under one group of their own.
    it('offers départements under their région, and pays étrangers apart', () => {
        renderConcurrence()
        openProvenanceFilter()

        expect(screen.getByRole('checkbox', { name: '87' })).toBeDefined()
        expect(
            screen.getByRole('checkbox', { name: 'Allemagne' })
        ).toBeDefined()
        expect(screen.getByText('Nouvelle-Aquitaine')).toBeDefined()
        expect(screen.getByText('Pays étrangers')).toBeDefined()
    })

    // The référentiel is the list of départements, so one nothing is drawn
    // from is still somewhere a reader may look.
    it('offers a département no plan draws from', () => {
        renderConcurrence()
        openProvenanceFilter()

        expect(screen.getByRole('checkbox', { name: '24' })).toBeDefined()
    })

    // There is no référentiel of countries, so the group is what was drawn on
    // — and a country drawn on twice is one country.
    it('names a country once, however many draw on it', () => {
        renderConcurrence([
            {
                ...saintJunien,
                approvisionnements: [
                    dAllemagne,
                    { ...dAllemagne, fournisseur: scieriePicard.siret },
                ],
            },
        ])
        openProvenanceFilter()

        expect(
            screen.getAllByRole('checkbox', { name: 'Allemagne' })
        ).toHaveLength(1)
    })

    // Same reading in the column: it lists provenances, not approvisionnements.
    it('names each provenance once in the provenances cell', () => {
        renderConcurrence([
            {
                ...saintJunien,
                approvisionnements: [
                    deHauteVienne,
                    { ...deHauteVienne, fournisseur: forstGmbh.siret },
                    dAllemagne,
                ],
            },
        ])

        expect(within(planRow()).getAllByRole('cell')[2].textContent).toBe(
            '87, Allemagne'
        )
    })

    it('narrows the retained tonnage to a foreign provenance', () => {
        renderConcurrence()
        openProvenanceFilter()
        check('Allemagne')

        const cells = within(planRow()).getAllByRole('cell')

        // Provenances retenues, then tonnage retenu: only what came from
        // Germany is left, while the plan's own total stays whole.
        expect(cells[4].textContent).toBe('Allemagne')
        expect(cells[5].textContent).toBe('80')
        expect(cells[3].textContent).toBe('200')
    })

    it('narrows the retained tonnage to a French provenance', () => {
        renderConcurrence()
        openProvenanceFilter()
        check('87')

        const cells = within(planRow()).getAllByRole('cell')

        expect(cells[4].textContent).toBe('87')
        expect(cells[5].textContent).toBe('120')
    })

    // A plan drawing on neither is not concurrent with what was asked about.
    it('drops a plan no selected provenance reaches', () => {
        renderConcurrence([
            saintJunien,
            {
                ...saintJunien,
                planDApprovisionnement: 'RCU Clair-Village',
                approvisionnements: [deHauteVienne],
            },
        ])
        openProvenanceFilter()
        check('Allemagne')

        expect(screen.getByText('RC Saint Junien')).toBeDefined()
        expect(screen.queryByText('RCU Clair-Village')).toBeNull()
    })

    // Nothing outside France has been drawn on, so there is no group to open.
    it('offers no pays group when no plan draws from abroad', () => {
        renderConcurrence([
            { ...saintJunien, approvisionnements: [deHauteVienne] },
        ])
        openProvenanceFilter()

        expect(screen.queryByText('Pays étrangers')).toBeNull()
    })
})
