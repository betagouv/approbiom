import Map from '@shared/react/components/Map'

export default function App() {
    return (
        <main className="app playground">
            <h1 className="fr-h3 playground__title">Playground</h1>

            <section className="playground__section">
                <h2 className="fr-h5">Map</h2>
                <Map />
            </section>
        </main>
    )
}
