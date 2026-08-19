import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { Instruction } from '@shared/core/domain/entities/instruction'
import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import TabUpdate from './TabUpdate'

function programmeAide(
    overrides: Partial<ProgrammeAide> = {}
): Pick<ProgrammeAide, 'shortName' | 'laureat'> {
    return { shortName: 'BCIAT', laureat: null, ...overrides }
}

function instruction(overrides: Partial<Instruction> = {}) {
    return {
        crb: 'Nouvelle Aquitaine',
        avisCrbRequis: true,
        avisCRB: 'Avis favorable',
        avisPrefet: 'En attente',
        phase: 'Avis préfet en attente',
        ...overrides,
    } satisfies Pick<
        Instruction,
        'avisCRB' | 'avisCrbRequis' | 'avisPrefet' | 'phase' | 'crb'
    >
}

const bciat = {
    id: 1,
    programmeAide: programmeAide(),
    instructions: [instruction(), instruction({ crb: 'Occitanie' })],
}

const granule = {
    id: 2,
    programmeAide: programmeAide({ shortName: 'GRANULE' }),
    instructions: [],
}

afterEach(() => {
    cleanup()
})

const getCard = (nom: string) =>
    screen.getByRole('heading', { name: nom }).closest('section') as HTMLElement

describe('TabUpdate', () => {
    it('says so when the plan carries no demande de subvention', () => {
        render(<TabUpdate demandesSubvention={[]} />)

        expect(screen.getByText(/Aucune demande de subvention/)).toBeDefined()
    })

    it('renders one card per demande, named after its programme d’aide', () => {
        render(<TabUpdate demandesSubvention={[bciat, granule]} />)

        expect(screen.getByRole('heading', { name: 'BCIAT' })).toBeDefined()
        expect(screen.getByRole('heading', { name: 'GRANULE' })).toBeDefined()
    })

    it('says so when a demande carries no instruction', () => {
        render(<TabUpdate demandesSubvention={[bciat, granule]} />)

        expect(
            within(getCard('GRANULE')).getByText(/Aucune instruction/)
        ).toBeDefined()
    })

    it('numbers the instructions and names the CRB that instructs them', () => {
        render(<TabUpdate demandesSubvention={[bciat]} />)

        expect(
            screen.getByText(
                /Instruction n° 1 · Instruit par Nouvelle Aquitaine/
            )
        ).toBeDefined()
        expect(
            screen.getByText(/Instruction n° 2 · Instruit par Occitanie/)
        ).toBeDefined()
    })

    it('shows the phase as plain text rather than as a tag', () => {
        render(<TabUpdate demandesSubvention={[bciat]} />)

        const phase = screen.getAllByText('Avis préfet en attente')[0]
        expect(phase.className).not.toContain('fr-tag')
        expect(phase.className).not.toContain('fr-badge')
    })

    it('offers every avis the domain defines, and starts on the stored one', () => {
        render(<TabUpdate demandesSubvention={[bciat]} />)

        const [avisCrb] = screen.getAllByRole<HTMLSelectElement>('combobox', {
            name: 'Avis CRB',
        })
        // The six of AVIS_CRB; the placeholder is `hidden`, so it is out of the
        // accessibility tree and does not count.
        expect(within(avisCrb).getAllByRole('option')).toHaveLength(6)
        expect(
            within(avisCrb).getByRole<HTMLOptionElement>('option', {
                name: 'Avis favorable',
            }).selected
        ).toBe(true)
    })

    it('offers the préfet its own shorter list', () => {
        render(<TabUpdate demandesSubvention={[bciat]} />)

        const [avisPrefet] = screen.getAllByRole<HTMLSelectElement>(
            'combobox',
            { name: 'Avis Préfet' }
        )
        // AVIS_PREFET has no « Non demandé »: the préfet is always asked.
        expect(within(avisPrefet).getAllByRole('option')).toHaveLength(5)
        expect(
            within(avisPrefet).queryByRole('option', { name: 'Non demandé' })
        ).toBeNull()
    })

    it('keeps the avis the user picks', () => {
        render(<TabUpdate demandesSubvention={[bciat]} />)

        const [avisCrb] = screen.getAllByRole<HTMLSelectElement>('combobox', {
            name: 'Avis CRB',
        })
        const reserve = within(avisCrb).getByRole<HTMLOptionElement>('option', {
            name: 'Avis réservé',
        })
        fireEvent.change(avisCrb, { target: { value: reserve.value } })

        expect(reserve.selected).toBe(true)
    })

    it('changes one instruction without touching the other', () => {
        render(<TabUpdate demandesSubvention={[bciat]} />)

        const [premier, second] = screen.getAllByRole<HTMLSelectElement>(
            'combobox',
            { name: 'Avis CRB' }
        )
        const reserve = within(premier).getByRole<HTMLOptionElement>('option', {
            name: 'Avis réservé',
        })
        fireEvent.change(premier, { target: { value: reserve.value } })

        expect(reserve.selected).toBe(true)
        expect(
            within(second).getByRole<HTMLOptionElement>('option', {
                name: 'Avis favorable',
            }).selected
        ).toBe(true)
    })

    it('disables the avis CRB list when no avis CRB is required', () => {
        render(
            <TabUpdate
                demandesSubvention={[
                    {
                        ...bciat,
                        instructions: [instruction({ avisCrbRequis: false })],
                    },
                ]}
            />
        )

        expect(
            screen.getByRole<HTMLSelectElement>('combobox', {
                name: 'Avis CRB',
            }).disabled
        ).toBe(true)
        // The préfet is asked either way, so its list stays open.
        expect(
            screen.getByRole<HTMLSelectElement>('combobox', {
                name: 'Avis Préfet',
            }).disabled
        ).toBe(false)
    })

    it('opens the avis CRB list as soon as an avis CRB is required', () => {
        render(
            <TabUpdate
                demandesSubvention={[
                    {
                        ...bciat,
                        instructions: [instruction({ avisCrbRequis: false })],
                    },
                ]}
            />
        )

        fireEvent.click(
            screen.getByRole('checkbox', { name: 'Avis CRB requis' })
        )

        expect(
            screen.getByRole<HTMLSelectElement>('combobox', {
                name: 'Avis CRB',
            }).disabled
        ).toBe(false)
    })

    it('reports the stored lauréat state beside the switch that changes it', () => {
        render(<TabUpdate demandesSubvention={[bciat]} />)

        const card = getCard('BCIAT')
        expect(within(card).getByText('Aucun lauréat')).toBeDefined()

        const toggle = within(card).getByRole<HTMLInputElement>('checkbox', {
            name: 'Ce plan est lauréat',
        })
        expect(toggle.checked).toBe(false)

        fireEvent.click(toggle)

        // The switch moves; the tag keeps reporting what is stored, so the user
        // can see what they are moving away from.
        expect(toggle.checked).toBe(true)
        expect(within(card).getByText('Aucun lauréat')).toBeDefined()
    })

    it('starts the lauréat switch on when the programme already has one', () => {
        render(
            <TabUpdate
                demandesSubvention={[
                    { ...bciat, programmeAide: programmeAide({ laureat: 7 }) },
                ]}
            />
        )

        expect(
            screen.getByRole<HTMLInputElement>('checkbox', {
                name: 'Ce plan est lauréat',
            }).checked
        ).toBe(true)
        expect(screen.getByText('Lauréat')).toBeDefined()
    })
})
