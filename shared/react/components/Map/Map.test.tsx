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

    // Leaflet left to itself guesses its image folder from the stylesheet and
    // gets it wrong once bundled, pointing every pin at a URL that does not
    // exist. The guess happens to land on a plausible-looking "marker-icon.png"
    // in dev, so only the built asset URL tells the two apart.
    it('points a pin at the bundled icon rather than a guessed path', () => {
        render(<Map center={[51.505, -0.09]} markers={[[51.5007, -0.1246]]} />)

        const pin = screen.getByAltText('Marker')

        expect(pin.getAttribute('src')).toBe(iconUrl)
    })

    // A polygon's options are what lets a caller tell one shape from another,
    // so they have to reach Leaflet rather than stop at the component. Leaflet
    // turns them into the drawn path's attributes, which is where they show.
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
