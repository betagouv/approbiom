import AsyncGate from '@shared/react/components/AsyncGate'
import { useAsyncState } from '@shared/react/hooks/UseAsyncState'
import { useEffect, useRef, useState } from 'react'
import Configuration from './components/Configuration'
import TableauDeBord from './components/TableauDeBord'
import {
    loadSuiviUtilisateur,
    type SuiviUtilisateurPorts,
} from './load-suivi-utilisateur'

export default function App(ports: SuiviUtilisateurPorts) {
    const state = useAsyncState(() => loadSuiviUtilisateur(ports))
    const [configuring, setConfiguring] = useState(false)
    const titre = useRef<HTMLHeadingElement>(null)

    const { options } = ports
    const { refresh } = state
    useEffect(() => options.onEdit(() => setConfiguring(true)), [options])
    // Set from the form, or saved or reverted from Grist's own header: the
    // options are read again whichever way they changed.
    useEffect(() => options.onChange(refresh), [options, refresh])

    // The button that closed the form goes with it: without somewhere to land,
    // the focus would fall back to the top of the page.
    function closeConfiguration() {
        setConfiguring(false)
        titre.current?.focus()
    }

    return (
        <main className="fr-container fr-py-2w">
            <h1 className="fr-h3" ref={titre} tabIndex={-1}>
                Suivi des interactions utilisateur
            </h1>
            <p className="fr-text--sm">
                Les plans créés avant le début du suivi ne sont pas comptés.
            </p>
            <AsyncGate state={state}>
                {({ suivi, nombreUtilisateurs }) =>
                    configuring ? (
                        <Configuration
                            nombreUtilisateurs={nombreUtilisateurs}
                            onSave={async (nombre) => {
                                await options.save({
                                    nombreUtilisateurs: nombre,
                                })
                                closeConfiguration()
                            }}
                            onCancel={closeConfiguration}
                        />
                    ) : (
                        <TableauDeBord
                            suivi={suivi}
                            nombreUtilisateurs={nombreUtilisateurs}
                        />
                    )
                }
            </AsyncGate>
        </main>
    )
}
