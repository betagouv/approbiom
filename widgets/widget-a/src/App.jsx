import Button from '@shared/components/Button'
import './App.css'

export default function App() {
    return (
        <main className="app">
            <h1>Hello world — Widget A</h1>
            <p>Widget Grist personnalisé, en attente de données.</p>
            <Button onClick={() => alert('Widget A')}>Bouton partagé</Button>
        </main>
    )
}
