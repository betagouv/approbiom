import Button from '@shared/components/Button'
import './App.css'

export default function App() {
  return (
    <main className="app">
      <h1>Hello world — Widget B</h1>
      <p>Widget Grist personnalisé, en attente de données.</p>
      <Button onClick={() => alert('Widget B')}>Bouton partagé</Button>
    </main>
  )
}
