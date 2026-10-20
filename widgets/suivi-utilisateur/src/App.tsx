import AsyncGate from '@shared/react/components/AsyncGate'
import { useAsyncState } from '@shared/react/hooks/UseAsyncState'
import TableauDeBord from './components/TableauDeBord'
import { lundiLong } from './format-semaine'
import {
    loadSuiviUtilisateur,
    type SuiviUtilisateurPorts,
} from './load-suivi-utilisateur'
import { DEBUT_DU_SUIVI } from './suivi-creations'

export default function App(ports: SuiviUtilisateurPorts) {
    const state = useAsyncState(() => loadSuiviUtilisateur(ports))

    return (
        <main className="fr-container fr-py-2w">
            <h1 className="fr-h3">Suivi des interactions utilisateur</h1>
            <p className="fr-text--sm">
                Les plans créés avant le {lundiLong(DEBUT_DU_SUIVI)}, début du
                suivi, ne sont pas comptés.
            </p>
            <AsyncGate state={state}>
                {(suivi) => <TableauDeBord suivi={suivi} />}
            </AsyncGate>
        </main>
    )
}
