import '@gouvfr/dsfr/dist/component/link/link.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'
import { useState, type SubmitEvent } from 'react'
import Modal from '@shared/react/components/Modal'
import { applyUserActions, parseUserActions } from '../user-actions'
import Accordion from './Accordion'
import RawResultView from './RawResultView'
import { useRawResult } from './useRawResult'

export default function UserActions() {
    const [actions, setActions] = useState('')
    const [inputError, setInputError] = useState('')
    const [pendingActions, setPendingActions] = useState<unknown[][] | null>(
        null
    )
    const { result, show } = useRawResult()

    function handleSubmit(event: SubmitEvent) {
        event.preventDefault()
        try {
            setPendingActions(parseUserActions(actions))
        } catch (error) {
            setInputError(
                error instanceof Error ? error.message : String(error)
            )
        }
    }

    function apply() {
        if (!pendingActions) return
        setPendingActions(null)
        void show(() => applyUserActions(pendingActions))
    }

    return (
        <>
            <Accordion title="Conseils avant d’appliquer une action">
                <ul>
                    <li>
                        Télécharger le document pour en avoir une sauvegarde.
                    </li>
                    <li>Tester d’abord l’action dans une copie du document.</li>
                    <li>
                        Ou noter le dernier état du document, pour pouvoir
                        revenir en arrière.
                    </li>
                    <li>
                        S’aider de la documentation :{' '}
                        <a
                            className="fr-link"
                            href="https://community.getgrist.com/t/a-complete-guide-for-useractions-and-the-action-button-widget/13484"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            guide complet des UserActions
                        </a>
                        .
                    </li>
                </ul>
            </Accordion>
            <form onSubmit={handleSubmit}>
                <div
                    className={`fr-input-group${inputError ? ' fr-input-group--error' : ''}`}
                >
                    <label className="fr-label" htmlFor="user-actions">
                        Actions utilisateurs
                    </label>
                    <textarea
                        className={`fr-input${inputError ? ' fr-input--error' : ''}`}
                        id="user-actions"
                        rows={10}
                        value={actions}
                        onChange={(event) => {
                            setActions(event.target.value)
                            setInputError('')
                        }}
                        aria-describedby={
                            inputError ? 'user-actions-error' : undefined
                        }
                        required
                    />
                    {inputError && (
                        <p id="user-actions-error" className="fr-error-text">
                            {inputError}
                        </p>
                    )}
                </div>
                <button className="fr-btn" type="submit">
                    Appliquer l’action
                </button>
            </form>
            <RawResultView result={result} />
            <Modal
                open={pendingActions !== null}
                onClose={() => setPendingActions(null)}
                title="Appliquer l’action ?"
                titleIcon="fr-icon-warning-line"
                actions={
                    <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg">
                        <li>
                            <button
                                className="fr-btn"
                                type="button"
                                onClick={apply}
                            >
                                Appliquer
                            </button>
                        </li>
                        <li>
                            <button
                                className="fr-btn fr-btn--secondary"
                                type="button"
                                onClick={() => setPendingActions(null)}
                            >
                                Annuler
                            </button>
                        </li>
                    </ul>
                }
            >
                <p>
                    Cette action peut modifier le document de façon importante.
                    Voulez-vous continuer ?
                </p>
            </Modal>
        </>
    )
}
