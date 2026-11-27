import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DataSourceUnavailableError } from '@shared/core/errors'
import { FAKE_PORTS } from './fake-data/ports'
import type { Ports } from './ports'
import App from './App'

afterEach(cleanup)

const portsFailingWith = (error: Error): Ports => ({
    ...FAKE_PORTS,
    plans: { list: () => Promise.reject(error) },
})

describe('App', () => {
    it('reads the fallback ports when the data source is unreachable', async () => {
        const fallbackPlans = vi.fn(() => FAKE_PORTS.plans.list())

        render(
            <App
                ports={portsFailingWith(
                    new DataSourceUnavailableError('no Grist')
                )}
                fallbackPorts={{
                    ...FAKE_PORTS,
                    plans: { list: fallbackPlans },
                }}
            />
        )

        await waitFor(() => expect(fallbackPlans).toHaveBeenCalled())
    })

    it('does not fall back on any other error', async () => {
        const fallbackPlans = vi.fn(() => FAKE_PORTS.plans.list())

        const { findByRole } = render(
            <App
                ports={portsFailingWith(new Error('boom'))}
                fallbackPorts={{
                    ...FAKE_PORTS,
                    plans: { list: fallbackPlans },
                }}
            />
        )

        await findByRole('button', { name: 'Réessayer' })
        expect(fallbackPlans).not.toHaveBeenCalled()
    })
})
