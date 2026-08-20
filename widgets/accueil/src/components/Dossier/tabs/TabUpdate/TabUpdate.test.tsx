import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ComponentProps } from 'react'
import type { InstructionDetail } from '@shared/core/application/services/plan-detail'
import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import TabUpdate from './TabUpdate'

const PLAN_ID = 1

function programmeAide(
    overrides: Partial<ProgrammeAide> = {}
): Pick<ProgrammeAide, 'id' | 'appelAProjet' | 'laureat'> {
    return {
        id: 1,
        appelAProjet: 'BCIAT (2023)',
        laureat: null,
        ...overrides,
    }
}

function instruction(overrides: Partial<InstructionDetail> = {}) {
    return {
        id: 1,
        crbName: 'Nouvelle Aquitaine',
        avisCrbRequis: true,
        avisCRB: 'Avis favorable',
        avisPrefet: 'En attente',
        phase: 'Avis préfet en attente',
        ...overrides,
    } satisfies Pick<
        InstructionDetail,
        'id' | 'avisCRB' | 'avisCrbRequis' | 'avisPrefet' | 'phase' | 'crbName'
    >
}

const bciat = {
    id: 1,
    programmeAide: programmeAide(),
    instructions: [instruction(), instruction({ id: 2, crbName: 'Occitanie' })],
}

const granule = {
    id: 2,
    programmeAide: programmeAide({ id: 2, appelAProjet: 'GRANULE (2023)' }),
    instructions: [],
}

type Demandes = ComponentProps<typeof TabUpdate>['demandesSubvention']

const updateInstruction = vi.fn()
const updateIsPlanLaureatForProgrammeAide = vi.fn()
const refresh = vi.fn()

const renderTab = (demandesSubvention: Demandes) =>
    render(
        <TabUpdate
            planId={PLAN_ID}
            demandesSubvention={demandesSubvention}
            updateInstruction={updateInstruction}
            updateIsPlanLaureatForProgrammeAide={
                updateIsPlanLaureatForProgrammeAide
            }
            refresh={refresh}
        />
    )

beforeEach(() => {
    updateInstruction.mockReset().mockResolvedValue(undefined)
    updateIsPlanLaureatForProgrammeAide.mockReset().mockResolvedValue(undefined)
    refresh.mockReset()
})

afterEach(() => {
    cleanup()
})

const getCard = (nom: string) =>
    screen.getByRole('heading', { name: nom }).closest('section') as HTMLElement

describe('TabUpdate', () => {
    it('says so when the plan carries no demande de subvention', () => {
        renderTab([])

        expect(screen.getByText(/Aucune demande de subvention/)).toBeDefined()
    })

    it('renders one card per demande, named after its appel à projet', () => {
        renderTab([bciat, granule])

        expect(
            screen.getByRole('heading', { name: 'BCIAT (2023)' })
        ).toBeDefined()
        expect(
            screen.getByRole('heading', { name: 'GRANULE (2023)' })
        ).toBeDefined()
    })

    it('says so when a demande carries no instruction', () => {
        renderTab([bciat, granule])

        expect(
            within(getCard('GRANULE (2023)')).getByText(/Aucune instruction/)
        ).toBeDefined()
    })

    it('names the CRB that instructs each instruction', () => {
        renderTab([bciat])

        expect(
            screen.getByText('Instruit par Nouvelle Aquitaine')
        ).toBeDefined()
        expect(screen.getByText('Instruit par Occitanie')).toBeDefined()
    })

    it('shows the phase as plain text rather than as a tag', () => {
        renderTab([bciat])

        // The phase names itself, so it is read as a sentence rather than as a
        // bare status word standing on its own.
        const [phase] = screen.getAllByText(
            /Phase de l'instruction\s*:\s*Avis préfet en attente/
        )
        expect(phase.className).not.toContain('fr-tag')
        expect(phase.className).not.toContain('fr-badge')
    })

    it('offers every avis the domain defines, and starts on the stored one', () => {
        renderTab([bciat])

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
        renderTab([bciat])

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

    // The avis a pick shows is the one the document holds: nothing is kept here
    // until the write comes back, so there is nothing to assert until the tab
    // shows a change of its own again.
    it.todo('keeps the avis the user picks')

    it('changes one instruction without touching the other', () => {
        renderTab([bciat])

        const [premier] = screen.getAllByRole<HTMLSelectElement>('combobox', {
            name: 'Avis CRB',
        })
        const reserve = within(premier).getByRole<HTMLOptionElement>('option', {
            name: 'Avis réservé',
        })
        fireEvent.change(premier, { target: { value: reserve.value } })

        // The second instruction of the demande is rowId 2: naming the wrong
        // one would write the avis over its neighbour's.
        expect(updateInstruction).toHaveBeenCalledTimes(1)
        expect(updateInstruction).toHaveBeenCalledWith(1, {
            avisCRB: 'Avis réservé',
        })
    })

    it('writes the avis CRB the user picks, then reads the document again', async () => {
        renderTab([bciat])

        const [avisCrb] = screen.getAllByRole<HTMLSelectElement>('combobox', {
            name: 'Avis CRB',
        })
        const reserve = within(avisCrb).getByRole<HTMLOptionElement>('option', {
            name: 'Avis réservé',
        })
        fireEvent.change(avisCrb, { target: { value: reserve.value } })

        expect(updateInstruction).toHaveBeenCalledWith(1, {
            avisCRB: 'Avis réservé',
        })
        // What the document now holds is what the screen shows next, so the
        // read only follows once the write has been acknowledged.
        expect(refresh).not.toHaveBeenCalled()
        await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
    })

    it('leaves the screen alone when the write is refused', async () => {
        updateInstruction.mockRejectedValue(new Error('refusé'))

        renderTab([bciat])

        const [avisCrb] = screen.getAllByRole<HTMLSelectElement>('combobox', {
            name: 'Avis CRB',
        })
        fireEvent.change(avisCrb, {
            target: {
                value: within(avisCrb).getByRole<HTMLOptionElement>('option', {
                    name: 'Avis réservé',
                }).value,
            },
        })

        await vi.waitFor(() => expect(updateInstruction).toHaveBeenCalled())
        expect(refresh).not.toHaveBeenCalled()
    })

    it('leaves the avis CRB list out when no avis CRB is required', () => {
        renderTab([
            {
                ...bciat,
                instructions: [instruction({ avisCrbRequis: false })],
            },
        ])

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

    it('writes the avis CRB requis switch the user moves', () => {
        renderTab([bciat])

        // The instruction requires an avis, so moving the switch takes it back
        // to `false` — a write that is easily lost by reading a field's
        // truthiness rather than its presence.
        fireEvent.click(
            screen.getAllByRole('checkbox', { name: 'Avis CRB requis' })[0]
        )

        expect(updateInstruction).toHaveBeenCalledWith(1, {
            avisCrbRequis: false,
        })
    })

    it('writes the avis CRB requis switch back on', () => {
        renderTab([
            { ...bciat, instructions: [instruction({ avisCrbRequis: false })] },
        ])

        fireEvent.click(
            screen.getByRole('checkbox', { name: 'Avis CRB requis' })
        )

        expect(updateInstruction).toHaveBeenCalledWith(1, {
            avisCrbRequis: true,
        })
    })

    it('writes the avis préfet the user picks', () => {
        renderTab([bciat])

        const [avisPrefet] = screen.getAllByRole<HTMLSelectElement>(
            'combobox',
            { name: 'Avis Préfet' }
        )
        fireEvent.change(avisPrefet, {
            target: {
                value: within(avisPrefet).getByRole<HTMLOptionElement>(
                    'option',
                    { name: 'Avis défavorable' }
                ).value,
            },
        })

        expect(updateInstruction).toHaveBeenCalledWith(1, {
            avisPrefet: 'Avis défavorable',
        })
    })

    it('names the instruction whose avis préfet changed', () => {
        renderTab([bciat])

        const [, second] = screen.getAllByRole<HTMLSelectElement>('combobox', {
            name: 'Avis Préfet',
        })
        fireEvent.change(second, {
            target: {
                value: within(second).getByRole<HTMLOptionElement>('option', {
                    name: 'Avis défavorable',
                }).value,
            },
        })

        // The second instruction of the demande is rowId 2.
        expect(updateInstruction).toHaveBeenCalledWith(2, {
            avisPrefet: 'Avis défavorable',
        })
    })

    it('keeps the avis CRB it was given while the list is out of the way', () => {
        renderTab([bciat])

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

    it('names the plan lauréat of the programme whose switch was moved', () => {
        renderTab([bciat, granule])

        fireEvent.click(
            within(getCard('BCIAT (2023)')).getByRole('checkbox', {
                name: 'Ce plan est lauréat',
            })
        )

        // The plan the tab was opened on, under the programme the switch sits
        // in — GRANULE (2023), rowId 2, is left as it is.
        expect(updateIsPlanLaureatForProgrammeAide).toHaveBeenCalledTimes(1)
        expect(updateIsPlanLaureatForProgrammeAide).toHaveBeenCalledWith(
            PLAN_ID,
            1,
            true
        )
    })

    it('takes the plan back off the programme it was lauréat of', () => {
        renderTab([
            { ...bciat, programmeAide: programmeAide({ laureat: PLAN_ID }) },
        ])

        fireEvent.click(
            screen.getByRole('checkbox', { name: 'Ce plan est lauréat' })
        )

        expect(updateIsPlanLaureatForProgrammeAide).toHaveBeenCalledWith(
            PLAN_ID,
            1,
            false
        )
    })

    it('starts the lauréat switch on when this plan is the one named', () => {
        renderTab([
            { ...bciat, programmeAide: programmeAide({ laureat: PLAN_ID }) },
        ])

        expect(
            screen.getByRole<HTMLInputElement>('checkbox', {
                name: 'Ce plan est lauréat',
            }).checked
        ).toBe(true)
    })

    it('leaves the lauréat switch off when the programme named another plan', () => {
        renderTab([{ ...bciat, programmeAide: programmeAide({ laureat: 99 }) }])

        expect(
            screen.getByRole<HTMLInputElement>('checkbox', {
                name: 'Ce plan est lauréat',
            }).checked
        ).toBe(false)
    })
})
