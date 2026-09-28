import '@gouvfr/dsfr/dist/component/alert/alert.main.min.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/component/callout/callout.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-arrows/icons-arrows.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import { useState } from 'react'

export type ExtractionFailureProps = {
    message: string
    onRetry: () => void
    onBack: () => void
}

export default function ExtractionFailure({
    message,
    onRetry,
    onBack,
}: ExtractionFailureProps) {
    const [copied, setCopied] = useState(false)

    function copy() {
        void navigator.clipboard.writeText(message).then(() => setCopied(true))
    }

    return (
        <>
            <div className="fr-alert fr-alert--error" role="alert">
                <h3 className="fr-alert__title">L&apos;extraction a échoué</h3>
                <div className="extraction__error">
                    <code className="extraction__message">{message}</code>
                    <button
                        type="button"
                        className="fr-btn fr-btn--tertiary fr-btn--sm"
                        onClick={copy}
                    >
                        {copied ? 'Copié' : 'Copier'}
                    </button>
                </div>
            </div>

            <div className="fr-callout fr-mb-0">
                <h3 className="fr-callout__title fr-h6">
                    Structure attendue du document ADEME
                </h3>
                <p className="fr-callout__text fr-text--md">
                    Un classeur Excel (.xlsx) avec une feuille dont le nom
                    contient « Fournisseurs ». Dans les 40 premières lignes, une
                    ligne d&apos;en-tête commence par « Fournisseur » en colonne
                    A et contient les colonnes Sous catégorie, Tonnage et
                    Répartition approximative. Chaque ligne doit avoir un
                    tonnage numérique.
                </p>
            </div>

            <div className="extraction__actions">
                <button
                    type="button"
                    className="fr-btn fr-btn--icon-left fr-icon-refresh-line"
                    onClick={onRetry}
                >
                    Recommencer l&apos;extraction
                </button>
                <button
                    type="button"
                    className="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-arrow-left-line"
                    onClick={onBack}
                >
                    Choisir un autre document
                </button>
            </div>
        </>
    )
}
