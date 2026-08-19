import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { DemandeSubventionDetail } from '@shared/core/application/services/plan-detail'
import type { Instruction } from '@shared/core/domain/entities/instruction'
import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import FilInstruction from './FilInstruction'

function programmeAide(overrides: Partial<ProgrammeAide> = {}): ProgrammeAide {
    return {
        id: 1,
        year: 2023,
        name: 'Biomasse Chaleur Industrie Agriculture Tertiaire',
        shortName: 'BCIAT',
        appelAProjet: 'BCIAT (2023)',
        ...overrides,
    }
}

function instruction(overrides: Partial<Instruction> = {}): Instruction {
    return {
        crb: 'Nouvelle Aquitaine',
        subvention: 1,
        name: 'Instruction 1',
        avisCrbRequis: true,
        dateSaisineCrb: new Date('2026-03-15'),
        dateAvisCrb: new Date('2026-08-05'),
        avisCRB: 'Avis favorable',
        dateAvisPrefet: null,
        avisPrefet: 'En attente',
        phase: 'Avis préfet en attente',
        ...overrides,
    }
}

const bciat: DemandeSubventionDetail = {
    id: 1,
    programmeAide: programmeAide(),
    instructions: [
        instruction(),
        instruction({ crb: 'Occitanie', name: 'Instruction 2' }),
    ],
}

const bcib: DemandeSubventionDetail = {
    id: 2,
    programmeAide: programmeAide({ id: 2, shortName: 'BCIB' }),
    instructions: [instruction({ name: 'Instruction 3' })],
}

afterEach(() => {
    cleanup()
})

describe('FilInstruction', () => {
    it('opens one chronology per programme d’aide', () => {
        render(<FilInstruction demandes={[bciat, bcib]} />)

        expect(
            screen.getByRole('heading', {
                name: 'Chronologie de l’instruction - BCIAT',
            })
        ).toBeDefined()
        expect(
            screen.getByRole('heading', {
                name: 'Chronologie de l’instruction - BCIB',
            })
        ).toBeDefined()
    })

    it('names every CRB the programme was instructed by', () => {
        render(<FilInstruction demandes={[bciat]} />)

        expect(
            screen.getByRole('heading', { name: 'Nouvelle Aquitaine' })
        ).toBeDefined()
        expect(screen.getByRole('heading', { name: 'Occitanie' })).toBeDefined()
        expect(screen.getAllByRole('list')).toHaveLength(2)
    })

    it('reads each step behind us by its date, the one in progress without', () => {
        render(<FilInstruction demandes={[bcib]} />)

        const chronologie = screen.getByRole('list')

        expect(within(chronologie).getByText('15 mars 2026')).toBeDefined()
        expect(within(chronologie).getByText('5 août 2026')).toBeDefined()
        // The préfet's avis is what is being waited on, so it has no date.
        expect(
            within(chronologie).getByText('Date non renseignée')
        ).toBeDefined()
    })

    it('tags the avis a CRB has given', () => {
        render(<FilInstruction demandes={[bcib]} />)

        expect(screen.getByText('Avis favorable')).toBeDefined()
    })

    it('says so when the dossier carries no demande de subvention', () => {
        render(<FilInstruction demandes={[]} />)

        expect(
            screen.getByText(
                'Aucune demande de subvention n’est rattachée à ce dossier.'
            )
        ).toBeDefined()
    })
})
