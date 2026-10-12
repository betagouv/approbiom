import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import { useState } from 'react'
import Alert from '@shared/react/components/Alert'
import Modal from '@shared/react/components/Modal'

export type ImportModalProps = {
    approvisionnementCount: number
    onConfirm: () => Promise<void>
    onClose: () => void
}

export default function ImportModal({
    approvisionnementCount,
    onConfirm,
    onClose,
}: ImportModalProps) {
    const [importing, setImporting] = useState(false)
    const [failure, setFailure] = useState<string | null>(null)

    const one = approvisionnementCount === 1
    const importLabel = one
        ? 'Importer cet approvisionnement'
        : `Importer ces ${approvisionnementCount} approvisionnements`

    async function confirm() {
        setImporting(true)
        setFailure(null)
        try {
            await onConfirm()
        } catch (error) {
            setFailure(
                error instanceof Error
                    ? error.message
                    : "L'import a échoué. Aucun approvisionnement n'a été créé. Réessayez."
            )
            setImporting(false)
        }
    }

    return (
        <Modal
            open
            onClose={onClose}
            title="Avez-vous pensé à vérifier chaque approvisionnement ?"
            titleIcon="fr-icon-warning-line"
            actions={
                <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg fr-btns-group--icon-left">
                    <li>
                        <button
                            type="button"
                            className="fr-btn fr-icon-download-line"
                            disabled={importing}
                            onClick={() => void confirm()}
                        >
                            {importLabel}
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            className="fr-btn fr-btn--secondary"
                            onClick={onClose}
                        >
                            Annuler
                        </button>
                    </li>
                </ul>
            }
        >
            {failure && (
                <Alert severity="error" size="sm">
                    {failure}
                </Alert>
            )}
            <p className="fr-text--md">
                En cliquant sur « {importLabel} »,{' '}
                {one ? 'il sera sauvegardé' : 'ils seront sauvegardés'} dans la
                base de données.
            </p>
            <p className="fr-text--md fr-m-0">
                Vous pourrez toujours {one ? 'le' : 'les'} modifier ou supprimer
                dans l&apos;onglet Corrections.
            </p>
        </Modal>
    )
}
