import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Map from './Map'

afterEach(() => {
    cleanup()
})

describe('Map', () => {
    it('displays two pins if two marker positions are provided', () => {
        render(
            <Map
                center={[51.505, -0.09]}
                markers={[
                    [51.5007, -0.1246],
                    [51.5055, -0.0754],
                ]}
            />
        )

        expect(screen.getAllByAltText('Marker')).toHaveLength(2)
    })
})
