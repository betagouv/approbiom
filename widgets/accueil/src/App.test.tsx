import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
    AccessDeniedError,
    DataSourceUnavailableError,
} from '@shared/application/errors'
import type { PlanQuery } from '@shared/application/ports/plan-query'
import App from './App'

const planQuery = (list: PlanQuery['list']): PlanQuery => ({ list })

afterEach(() => {
    cleanup()
})

describe('App', () => {
    it('renders the screen once the plans have loaded', async () => {
        render(<App plans={planQuery(() => Promise.resolve([]))} />)

        expect(
            await screen.findByRole('heading', {
                level: 1,
                name: 'Suivi des plans d’approvisionnement',
            })
        ).toBeDefined()
    })

    it('says so when the page is not running inside Grist', async () => {
        render(
            <App
                plans={planQuery(() =>
                    Promise.reject(new DataSourceUnavailableError('no grist'))
                )}
            />
        )

        expect(
            await screen.findByText(/n’est pas ouverte dans Grist/)
        ).toBeDefined()
    })

    it('says so when the document refuses to be read', async () => {
        render(
            <App
                plans={planQuery(() =>
                    Promise.reject(new AccessDeniedError('read only'))
                )}
            />
        )

        expect(
            await screen.findByText(/besoin d’un accès complet au document/)
        ).toBeDefined()
    })

    it('shows the message of any other failure', async () => {
        render(
            <App
                plans={planQuery(() =>
                    Promise.reject(new Error('Table not found'))
                )}
            />
        )

        expect(await screen.findByText(/Table not found/)).toBeDefined()
    })
})
