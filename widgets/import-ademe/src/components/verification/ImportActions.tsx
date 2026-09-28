import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import { useState } from 'react'

export type ImportActionsProps = {
    approvisionnementCount: number
    onCancel: () => void
    onImport: () => Promise<void>
}

export default function ImportActions({
    approvisionnementCount,
    onCancel,
    onImport,
}: ImportActionsProps) {
    const [importing, setImporting] = useState(false)
    const [failed, setFailed] = useState(false)
    const canImport = approvisionnementCount > 0

    function importLine() {
        setImporting(true)
        setFailed(false)
        onImport().catch(() => {
            setImporting(false)
            setFailed(true)
        })
    }

    return (
        <div className="import-actions">
            <p
                className={`fr-text--sm fr-m-0 import-actions__summary${failed ? ' import-actions__summary--error' : ''}`}
                role={failed ? 'alert' : undefined}
            >
                {failed
                    ? "L'import a échoué. Réessayez."
                    : canImport
                      ? `${approvisionnementCount} ligne${approvisionnementCount > 1 ? 's' : ''} ${approvisionnementCount > 1 ? 'seront créées' : 'sera créée'} dans Approvisionnement.`
                      : 'Choisissez un fournisseur, une ressource et au moins une provenance.'}
            </p>
            <button
                type="button"
                className="fr-btn fr-btn--secondary"
                onClick={onCancel}
            >
                Annuler
            </button>
            <button
                type="button"
                className="fr-btn fr-btn--icon-left fr-icon-check-line"
                disabled={!canImport || importing}
                onClick={importLine}
            >
                {approvisionnementCount > 1
                    ? `Importer les ${approvisionnementCount} approvisionnements`
                    : "Importer l'approvisionnement"}
            </button>
        </div>
    )
}
