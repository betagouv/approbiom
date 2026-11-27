import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Alert from './Alert'

afterEach(cleanup)

describe('Alert', () => {
    it('interrupts for an error, waits its turn for a success', () => {
        render(
            <>
                <Alert severity="error">L&apos;enregistrement a échoué.</Alert>
                <Alert severity="success">Approvisionnement modifié.</Alert>
            </>
        )

        expect(screen.getByRole('alert').textContent).toBe(
            "L'enregistrement a échoué."
        )
        expect(screen.getByRole('status').textContent).toBe(
            'Approvisionnement modifié.'
        )
    })

    it('takes the small size, which has no title', () => {
        render(
            <Alert severity="success" size="sm" title="Ignoré">
                Approvisionnement modifié.
            </Alert>
        )

        const alert = screen.getByRole('status')
        expect(alert.className).toBe('fr-alert fr-alert--success fr-alert--sm')
        expect(screen.queryByRole('heading')).toBeNull()
    })
})
