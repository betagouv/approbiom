import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
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

    // Leaflet guesses its image folder from the stylesheet, which breaks once
    // bundled; the guess looks plausible in dev, so only the asset URL tells.
    it('points a pin at the bundled icon rather than a guessed path', () => {
        render(<Map center={[51.505, -0.09]} markers={[[51.5007, -0.1246]]} />)

        const pin = screen.getByAltText('Marker')

        expect(pin.getAttribute('src')).toBe(iconUrl)
    })

    it('draws a polygon with the options it is given', () => {
        const { container } = render(
            <Map
                center={[51.505, -0.09]}
                polygons={[
                    {
                        latlngs: [
                            [51.5, -0.1],
                            [51.51, -0.1],
                            [51.51, -0.12],
                        ],
                        options: { color: '#000091' },
                    },
                ]}
            />
        )

        const polygon = container.querySelector('.leaflet-overlay-pane path')

        expect(polygon?.getAttribute('stroke')).toBe('#000091')
    })
})
