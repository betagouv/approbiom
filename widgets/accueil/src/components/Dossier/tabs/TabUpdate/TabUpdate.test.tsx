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

    it('names the CRB that instructs each instruction', () => {
        render(<TabUpdate demandesSubvention={[bciat]} />)

        expect(
            screen.getByText('Instruit par Nouvelle Aquitaine')
        ).toBeDefined()
        expect(screen.getByText('Instruit par Occitanie')).toBeDefined()
    })

    it('shows the phase as plain text rather than as a tag', () => {
        render(<TabUpdate demandesSubvention={[bciat]} />)

        // The phase names itself, so it is read as a sentence rather than as a
        // bare status word standing on its own.
        const [phase] = screen.getAllByText(
            /Phase de l'instruction\s*:\s*Avis préfet en attente/
        )
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

    it('leaves the avis CRB list out when no avis CRB is required', () => {
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

        // Not disabled but absent: there is no avis to record, so the list has
        // nothing to say.
        expect(screen.queryByRole('combobox', { name: 'Avis CRB' })).toBeNull()
        // The préfet is asked either way, so its list stays.
        expect(
            screen.getByRole<HTMLSelectElement>('combobox', {
                name: 'Avis Préfet',
            }).disabled
        ).toBe(false)
    })

    it('shows the avis CRB list as soon as an avis CRB is required', () => {
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

        expect(screen.getByRole('combobox', { name: 'Avis CRB' })).toBeDefined()
    })

    it('keeps the avis CRB it was given while the list is out of the way', () => {
        render(<TabUpdate demandesSubvention={[bciat]} />)

        const avisCrbRequis = screen.getAllByRole('checkbox', {
            name: 'Avis CRB requis',
        })[0]

        // Off, then on again: the list is unmounted in between, so the avis
        // only survives because the draft holds it rather than the `<select>`.
        fireEvent.click(avisCrbRequis)
        fireEvent.click(avisCrbRequis)

        const [avisCrb] = screen.getAllByRole<HTMLSelectElement>('combobox', {
            name: 'Avis CRB',
        })
        expect(
            within(avisCrb).getByRole<HTMLOptionElement>('option', {
                name: 'Avis favorable',
            }).selected
        ).toBe(true)
    })

    it('moves the lauréat switch of one demande without touching the other', () => {
        render(<TabUpdate demandesSubvention={[bciat, granule]} />)

        const getLaureat = (nom: string) =>
            within(getCard(nom)).getByRole<HTMLInputElement>('checkbox', {
                name: 'Ce plan est lauréat',
            })

        expect(getLaureat('BCIAT').checked).toBe(false)

        fireEvent.click(getLaureat('BCIAT'))

        expect(getLaureat('BCIAT').checked).toBe(true)
        expect(getLaureat('GRANULE').checked).toBe(false)
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
    })
})
