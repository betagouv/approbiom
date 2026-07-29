import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SelectStatut from './SelectStatut'
import { updatePlanStatus } from '@shared/use-cases/updatePlanStatus'

vi.mock('@shared/use-cases/updatePlanStatus', () => ({
    updatePlanStatus: vi.fn(),
}))

const update = vi.mocked(updatePlanStatus)

const PLAN_ID = 42

beforeEach(() => {
    update.mockReset()
    update.mockResolvedValue(undefined)

    // The component logs whatever it catches. Without this, the failure cases
    // below would print the stack traces they deliberately cause.
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
})

function renderSelect(
    statut: string | null,
    onRefetchPlan: () => Promise<void>
) {
    render(
        <SelectStatut
            planId={PLAN_ID}
            statut={statut}
            onRefetchPlan={onRefetchPlan}
        />
    )
}

const getRadio = (name: string) =>
    screen.getByRole<HTMLInputElement>('radio', { name })

const resolving = () =>
    vi.fn<() => Promise<void>>().mockResolvedValue(undefined)

describe('SelectStatut', () => {
    it('saves the picked status, then reads the plan back', async () => {
        const onRefetchPlan = resolving()
        renderSelect('projet', onRefetchPlan)

        fireEvent.click(getRadio('Obsolète'))

        await waitFor(() => {
            expect(update).toHaveBeenCalledWith({
                planId: PLAN_ID,
                status: 'obsolète',
            })
        })
        expect(onRefetchPlan).toHaveBeenCalledOnce()
        expect(screen.queryByRole('alert')).toBeNull()
    })

    it('keeps drawing the stored status until the refreshed plan comes back', async () => {
        const onRefetchPlan = resolving()
        renderSelect('projet', onRefetchPlan)

        fireEvent.click(getRadio('Obsolète'))
        await waitFor(() => {
            expect(onRefetchPlan).toHaveBeenCalledOnce()
        })

        // Nothing here holds the choice: the group draws `statut`, which only
        // changes once the parent hands down the row Grist stored. A selection
        // moving on its own would be this component inventing a value.
        expect(getRadio('Projet').checked).toBe(true)
        expect(getRadio('Obsolète').checked).toBe(false)
    })

    it('writes null when the plan is set back to « Indéfini »', async () => {
        renderSelect('projet', resolving())

        fireEvent.click(getRadio('Indéfini'))

        await waitFor(() => {
            expect(update).toHaveBeenCalledWith({
                planId: PLAN_ID,
                status: null,
            })
        })
    })

    it('reports a failed save, and does not read the plan back', async () => {
        update.mockRejectedValue(new Error('grist unreachable'))
        const onRefetchPlan = resolving()
        renderSelect('projet', onRefetchPlan)

        fireEvent.click(getRadio('Obsolète'))

        const alert = await screen.findByRole('alert')
        expect(alert.textContent).toContain('Enregistrement impossible')
        expect(alert.textContent).toContain('n’a pas pu être enregistré')

        // Nothing was written, so there is nothing to read back.
        expect(onRefetchPlan).not.toHaveBeenCalled()
    })

    it('reports a failed refresh as a saved status the screen is behind on', async () => {
        const onRefetchPlan = vi
            .fn<() => Promise<void>>()
            .mockRejectedValue(new Error('offline'))
        renderSelect('projet', onRefetchPlan)

        fireEvent.click(getRadio('Obsolète'))

        const alert = await screen.findByRole('alert')
        // The write went through, so the user is told to reload rather than to
        // retry a save that would only write the same value again.
        expect(alert.textContent).toContain('Affichage non actualisé')
        expect(alert.textContent).toContain('bien été enregistré')
        expect(update).toHaveBeenCalledWith({
            planId: PLAN_ID,
            status: 'obsolète',
        })
    })

    it('clears the error once a later attempt succeeds', async () => {
        update.mockRejectedValueOnce(new Error('grist unreachable'))
        renderSelect('projet', resolving())

        fireEvent.click(getRadio('Obsolète'))
        await screen.findByRole('alert')

        fireEvent.click(getRadio('Abandonné'))

        await waitFor(() => {
            expect(screen.queryByRole('alert')).toBeNull()
        })
    })
})
