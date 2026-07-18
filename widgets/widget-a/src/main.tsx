import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Widget entry point: mount React onto the <div id="root">
// declared in index.html.
const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#no root found in index.html')

createRoot(rootEl).render(
    <StrictMode>
        <App />
    </StrictMode>
)
